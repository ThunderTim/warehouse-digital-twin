#!/usr/bin/env python3
"""
Warehouse Container/Slot Generator v2

Converts warehouse inventory Excel data into JSON format for Three.js/R3F visualization.
Outputs one JSON file per bay, organized by building.

Location Label Format: 3W-26-D-02-01
  - 3W = Bay (Bay 3, West side)
  - 26 = Rack Row
  - D = Section of the rack
  - 02 = Level/Elevation (1 = bottom)
  - 01 = Slot position within section (left to right)

Usage:
    python warehouse_generator_v2.py input.xlsx --output-dir ./output
    
Output:
    bldg22_bay3E_containers.json
    bldg22_bay3W_containers.json (or error if missing data)
"""

import pandas as pd
import json
import argparse
import os
import re
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Tuple
from collections import defaultdict


# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class Config:
    """Configuration for coordinate generation - all values easily adjustable"""
    
    # Unit conversions - OUTPUT IS IN FEET (1 unit = 1 foot)
    # POS X and POS Y are already in feet, so no conversion needed
    feet_to_units: float = 1.0  # feet stay as feet
    inches_to_feet: float = 1.0 / 12.0  # 1 inch = 1/12 foot
    
    # Shelf/beam thickness between levels (inches) - CONFIGURABLE
    shelf_thickness_inches: float = 3.0
    
    # Floor offset for level 1 (inches)
    level_1_floor_offset_inches: float = 2.0
    
    # Default dimensions if missing (inches)
    default_width_inches: float = 36.0
    default_height_inches: float = 11.0
    default_depth_inches: float = 18.0
    
    # Position/slot subdivision
    # Slots go LEFT TO RIGHT (along X/width axis)
    # Each slot takes a fraction of the total section width
    max_slots_per_section: int = 8  # A through H
    
    @property
    def shelf_thickness_ft(self) -> float:
        return self.shelf_thickness_inches * self.inches_to_feet
    
    @property
    def level_1_floor_offset_ft(self) -> float:
        return self.level_1_floor_offset_inches * self.inches_to_feet


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class Container:
    """A single storage container/bin/slot"""
    id: str
    row: str
    section: str
    level: int
    slot: Optional[str]  # Position within section (A, B, C... or None)
    
    # Position in feet (relative to bay origin 0,0,0 at top-right)
    position: Dict[str, float] = field(default_factory=dict)
    
    # Dimensions in feet
    dimensions: Dict[str, float] = field(default_factory=dict)
    
    # Raw data for debugging
    raw_x_ft: Optional[float] = None
    raw_y_ft: Optional[float] = None
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "row": self.row,
            "section": self.section,
            "level": self.level,
            "slot": self.slot,
            "position": {
                "x": round(self.position.get('x', 0), 4),
                "y": round(self.position.get('y', 0), 4),
                "z": round(self.position.get('z', 0), 4)
            },
            "dimensions": {
                "x": round(self.dimensions.get('x', 0), 4),  # width
                "y": round(self.dimensions.get('y', 0), 4),  # height
                "z": round(self.dimensions.get('z', 0), 4)   # depth
            }
        }


@dataclass 
class Rack:
    """A rack containing multiple containers - for hotbox/selection"""
    id: str
    row: str
    sections: List[str]
    max_level: int
    container_count: int
    
    # Bounding box in feet
    bounds_min: Dict[str, float] = field(default_factory=dict)
    bounds_max: Dict[str, float] = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "row": self.row,
            "sections": self.sections,
            "max_level": self.max_level,
            "container_count": self.container_count,
            "bounds": {
                "min": {
                    "x": round(self.bounds_min.get('x', 0), 4),
                    "y": round(self.bounds_min.get('y', 0), 4),
                    "z": round(self.bounds_min.get('z', 0), 4)
                },
                "max": {
                    "x": round(self.bounds_max.get('x', 0), 4),
                    "y": round(self.bounds_max.get('y', 0), 4),
                    "z": round(self.bounds_max.get('z', 0), 4)
                }
            },
            "center": {
                "x": round((self.bounds_min.get('x', 0) + self.bounds_max.get('x', 0)) / 2, 4),
                "y": round((self.bounds_min.get('y', 0) + self.bounds_max.get('y', 0)) / 2, 4),
                "z": round((self.bounds_min.get('z', 0) + self.bounds_max.get('z', 0)) / 2, 4)
            }
        }


@dataclass
class BayData:
    """All data for a single bay"""
    building: str
    bay: str
    containers: List[Container] = field(default_factory=list)
    racks: List[Rack] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "building": self.building,
            "bay": self.bay,
            "bay_origin": {
                "x": 0, 
                "y": 0, 
                "z": 0,
                "note": "Origin is at top-left of bay (westernmost & southernmost point)"
            },
            "metadata": {
                "total_containers": len(self.containers),
                "total_racks": len(self.racks),
                "units": "feet",
                "coordinate_system": {
                    "x": "horizontal (left-right, positive = east)",
                    "y": "vertical (height, 0 = floor, positive = up)",
                    "z": "depth (positive = north, into warehouse)"
                }
            },
            "containers": [c.to_dict() for c in self.containers],
            "racks": [r.to_dict() for r in self.racks],
            "errors": self.errors,
            "warnings": self.warnings
        }


# ============================================================================
# BIN NAME PARSING
# ============================================================================

def parse_bin_name(bin_name: str) -> Optional[Dict]:
    """
    Parse a bin name into its components.
    
    Formats observed:
    - 7-char: 3E01A1A -> Bay=3E, Row=01, Section=A, Level=1, Slot=A
    - 6-char: 3E03C2  -> Bay=3E, Row=03, Section=C, Level=2, Slot=None
    - Special: 3W22ENDCAP, 3WBACKAREA -> special locations
    
    Returns dict with: bay, row, section, level, slot, special
    """
    if pd.isna(bin_name) or len(str(bin_name).strip()) < 6:
        return None
    
    bin_name = str(bin_name).strip().upper()
    
    # Check for special bins (ENDCAP, BACKAREA, WALL, CON)
    special_patterns = ['ENDCAP', 'BACKAREA', 'WALL', 'CON']
    for pattern in special_patterns:
        if pattern in bin_name:
            return {
                'bay': bin_name[:2] if len(bin_name) >= 2 else None,
                'row': None,
                'section': None,
                'level': None,
                'slot': None,
                'special': pattern,
                'raw': bin_name
            }
    
    # Standard format: [BAY 2ch][ROW 2ch][SECTION 1ch][LEVEL 1ch][SLOT 1ch optional]
    try:
        bay = bin_name[0:2]
        row = bin_name[2:4]
        section = bin_name[4]
        level_char = bin_name[5]
        
        # Level must be a digit
        if not level_char.isdigit():
            return None
        level = int(level_char)
        
        # Slot is optional (7th character)
        slot = bin_name[6] if len(bin_name) > 6 and bin_name[6].isalpha() else None
        
        return {
            'bay': bay,
            'row': row,
            'section': section,
            'level': level,
            'slot': slot,
            'special': None,
            'raw': bin_name
        }
    except (IndexError, ValueError):
        return None


# ============================================================================
# DATA LOADING & VALIDATION
# ============================================================================

def load_and_validate_excel(filepath: str, sheet_name: str = None) -> Tuple[pd.DataFrame, List[str]]:
    """Load Excel and return dataframe with validation errors
    
    Args:
        filepath: Path to Excel file
        sheet_name: Specific sheet to load. If None, tries to auto-detect.
    """
    errors = []
    
    # Get available sheets
    xl = pd.ExcelFile(filepath)
    available_sheets = xl.sheet_names
    
    # Determine which sheet to use
    if sheet_name:
        if sheet_name not in available_sheets:
            errors.append(f"CRITICAL: Sheet '{sheet_name}' not found. Available: {available_sheets}")
            return pd.DataFrame(), errors
        target_sheet = sheet_name
    else:
        # Auto-detect: look for sheets with 'bay' or 'bldg' in the name, or use first sheet with data
        candidates = [s for s in available_sheets if 'bay' in s.lower() or 'bldg' in s.lower()]
        if candidates:
            # Prefer sheets with 'bay' in name
            bay_sheets = [s for s in candidates if 'bay' in s.lower()]
            target_sheet = bay_sheets[0] if bay_sheets else candidates[0]
        else:
            # Skip obvious non-data sheets
            skip_sheets = ['legend', 'stats', 'notes', 'info']
            data_sheets = [s for s in available_sheets if s.lower().strip() not in skip_sheets]
            target_sheet = data_sheets[0] if data_sheets else available_sheets[0]
    
    print(f"  Reading sheet: '{target_sheet}'")
    
    df = pd.read_excel(filepath, sheet_name=target_sheet, header=0)
    df.columns = df.columns.str.strip()
    
    # Required columns
    required = ['Storage Bin', 'AREA (BAY)', 'BLDG']
    position_cols = ['POS X (ft)', 'POS Y']
    dimension_cols = ['Width (in)', 'Height (in)', 'Depth (in)']
    
    missing = [col for col in required if col not in df.columns]
    if missing:
        errors.append(f"CRITICAL: Missing required columns: {missing}")
        errors.append(f"Available columns: {list(df.columns)}")
        return df, errors
    
    # Check for position columns (warnings, not errors)
    missing_pos = [col for col in position_cols if col not in df.columns]
    if missing_pos:
        errors.append(f"WARNING: Missing position columns: {missing_pos}")
    
    # Convert numeric columns
    for col in position_cols + dimension_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    return df, errors


def check_bay_data_completeness(df: pd.DataFrame, bay: str) -> Tuple[bool, List[str]]:
    """Check if a bay has complete position data"""
    errors = []
    bay_df = df[df['AREA (BAY)'] == bay]
    
    if len(bay_df) == 0:
        errors.append(f"No data found for bay {bay}")
        return False, errors
    
    # Check position data
    unique_bins = bay_df.drop_duplicates('Storage Bin')
    missing_x = unique_bins['POS X (ft)'].isna().sum()
    missing_y = unique_bins['POS Y'].isna().sum()
    total = len(unique_bins)
    
    if missing_x == total or missing_y == total:
        errors.append(f"Bay {bay}: MISSING POSITION DATA - {total} containers have no X/Y coordinates")
        return False, errors
    
    if missing_x > 0:
        errors.append(f"Bay {bay}: {missing_x}/{total} containers missing X coordinate")
    if missing_y > 0:
        errors.append(f"Bay {bay}: {missing_y}/{total} containers missing Y coordinate")
    
    return True, errors


# ============================================================================
# HEIGHT/LEVEL CALCULATION & VALIDATION
# ============================================================================

def validate_shelf_heights(df: pd.DataFrame, bay: str, config: Config) -> Tuple[Dict[str, Dict[int, float]], List[str], List[str]]:
    """
    Validate shelf heights within sections and calculate Y positions.
    
    Rules:
    - All containers at the SAME LEVEL within a ROW should have the same height
    - Flag non-conforming heights as warnings (likely data entry errors)
    
    Returns: 
    - Dict[f"{row}_{section}", Dict[level, y_position_feet]]
    - List of warning messages (non-conforming heights - potential errors)
    - List of info messages (structural notes like missing levels)
    """
    warnings = []  # Potential data errors
    info = []      # Structural notes (not necessarily errors)
    height_map = defaultdict(dict)
    
    bay_df = df[df['AREA (BAY)'] == bay].copy()
    
    # Parse bin names
    bay_df['parsed'] = bay_df['Storage Bin'].apply(parse_bin_name)
    valid = bay_df[bay_df['parsed'].apply(lambda x: x is not None and x.get('level') is not None)]
    
    if len(valid) == 0:
        return dict(height_map), warnings, info
    
    # =========================================================================
    # VALIDATION: Check height consistency within each ROW at each LEVEL
    # =========================================================================
    row_level_heights = defaultdict(lambda: defaultdict(list))
    
    for _, r in valid.iterrows():
        p = r['parsed']
        row = p['row']
        level = p['level']
        height = r['Height (in)'] if pd.notna(r.get('Height (in)')) else None
        
        if height is not None:
            row_level_heights[row][level].append({
                'height': height,
                'section': p['section'],
                'bin': r['Storage Bin']
            })
    
    # Track height statistics for summary
    height_issues_count = 0
    
    # Check for non-conforming heights within each row/level
    for row, levels in row_level_heights.items():
        for level, height_data in levels.items():
            heights = [h['height'] for h in height_data]
            unique_heights = set(heights)
            
            if len(unique_heights) > 1:
                height_issues_count += 1
                
                # Non-conforming heights detected
                height_counts = defaultdict(list)
                for h in height_data:
                    height_counts[h['height']].append(h['section'])
                
                # Find the most common height (assumed correct)
                most_common_height = max(height_counts.keys(), key=lambda x: len(height_counts[x]))
                most_common_count = len(height_counts[most_common_height])
                
                # Report outliers (sections that differ from most common)
                outliers = []
                for height, sections in height_counts.items():
                    if height != most_common_height:
                        outliers.append(f"{height}\" in section(s) {','.join(sorted(sections))}")
                
                warnings.append(
                    f"Row {row}, Level {level}: Height mismatch - "
                    f"expected {most_common_height}\" ({most_common_count} sections) "
                    f"but found: {'; '.join(outliers)}"
                )
    
    # Add summary if there are height issues
    if height_issues_count > 0:
        info.insert(0, f"SUMMARY: {height_issues_count} row/level combinations have inconsistent shelf heights")
    
    # =========================================================================
    # Calculate cumulative heights using most common height per row/level
    # =========================================================================
    
    # Determine the "canonical" height for each row/level (most common)
    canonical_heights = {}  # (row, level) -> height in feet
    
    for row, levels in row_level_heights.items():
        for level, height_data in levels.items():
            heights = [h['height'] for h in height_data]
            # Use most common height (mode)
            most_common = max(set(heights), key=heights.count)
            canonical_heights[(row, level)] = most_common * config.inches_to_feet
    
    # Now calculate Y positions per section
    groups = valid.groupby([
        valid['parsed'].apply(lambda x: x['row']),
        valid['parsed'].apply(lambda x: x['section'])
    ])
    
    for (row, section), group in groups:
        key = f"{row}_{section}"
        
        # Get levels present in this section
        levels_present = sorted(set(group['parsed'].apply(lambda x: x['level'])))
        
        # Calculate cumulative Y positions
        cumulative_y = config.level_1_floor_offset_ft
        
        for level in range(1, max(levels_present) + 1):
            if level in levels_present:
                height_map[key][level] = cumulative_y
            
            # Get height for this level (use canonical or default)
            level_height = canonical_heights.get(
                (row, level), 
                config.default_height_inches * config.inches_to_feet
            )
            cumulative_y += level_height + config.shelf_thickness_ft
    
    return dict(height_map), warnings, info


def calculate_level_y_positions(df: pd.DataFrame, bay: str, config: Config) -> Dict[str, Dict[int, float]]:
    """
    Calculate Y position for each level within each rack section.
    
    Groups by Row + Section, then calculates cumulative heights.
    
    Returns: Dict[f"{row}_{section}", Dict[level, y_position_meters]]
    """
    height_map, _, _ = validate_shelf_heights(df, bay, config)
    return height_map


# ============================================================================
# CONTAINER GENERATION
# ============================================================================

def generate_containers(df: pd.DataFrame, bay: str, config: Config) -> Tuple[List[Container], List[str]]:
    """Generate Container objects for a bay"""
    warnings = []
    containers = []
    
    # Calculate level heights (validation warnings captured separately in process_bay)
    height_map, _, _ = validate_shelf_heights(df, bay, config)
    
    # Get unique bins for this bay
    bay_df = df[df['AREA (BAY)'] == bay].drop_duplicates('Storage Bin')
    
    # Slot position map (A=0, B=1, etc.) - slots go LEFT TO RIGHT along X axis
    slot_map = {chr(65+i): i for i in range(8)}  # A=0, B=1, ... H=7
    slot_map['-'] = 0
    slot_map[None] = 0
    
    for _, row in bay_df.iterrows():
        parsed = parse_bin_name(row['Storage Bin'])
        
        if parsed is None:
            warnings.append(f"Could not parse bin name: {row['Storage Bin']}")
            continue
        
        if parsed.get('special'):
            warnings.append(f"Skipping special bin: {row['Storage Bin']} ({parsed['special']})")
            continue
        
        # Skip if missing position data
        if pd.isna(row.get('POS X (ft)')) or pd.isna(row.get('POS Y')):
            continue
        
        rack_row = parsed['row']
        section = parsed['section']
        level = parsed['level']
        slot = parsed['slot']
        
        # Get dimensions (with defaults) - convert inches to feet
        width_in = row['Width (in)'] if pd.notna(row.get('Width (in)')) else config.default_width_inches
        height_in = row['Height (in)'] if pd.notna(row.get('Height (in)')) else config.default_height_inches
        depth_in = row['Depth (in)'] if pd.notna(row.get('Depth (in)')) else config.default_depth_inches
        
        width_ft = width_in * config.inches_to_feet
        height_ft = height_in * config.inches_to_feet
        depth_ft = depth_in * config.inches_to_feet
        
        # Calculate X position (already in feet from Excel)
        base_x = row['POS X (ft)'] * config.feet_to_units  # 1.0, no conversion
        
        # If there's a slot subdivision, offset along X (left to right)
        if slot and slot in slot_map:
            # Calculate slot width as fraction of total width
            slot_width = width_ft / config.max_slots_per_section
            slot_offset = slot_map[slot] * slot_width
            x = base_x + slot_offset
            # Adjust width to be per-slot
            width_ft = slot_width
        else:
            x = base_x
        
        # Calculate Y position (height) from level
        height_key = f"{rack_row}_{section}"
        if height_key in height_map and level in height_map[height_key]:
            y = height_map[height_key][level]
        else:
            # Fallback: assume standard spacing
            y = config.level_1_floor_offset_ft + (level - 1) * (config.default_height_inches * config.inches_to_feet + config.shelf_thickness_ft)
        
        # Calculate Z position (depth - from POS Y, already in feet)
        z = row['POS Y'] * config.feet_to_units  # 1.0, no conversion
        
        container = Container(
            id=row['Storage Bin'],
            row=rack_row,
            section=section,
            level=level,
            slot=slot,
            position={'x': x, 'y': y, 'z': z},
            dimensions={'x': width_ft, 'y': height_ft, 'z': depth_ft},
            raw_x_ft=row['POS X (ft)'],
            raw_y_ft=row['POS Y']
        )
        containers.append(container)
    
    return containers, warnings


# ============================================================================
# RACK GENERATION
# ============================================================================

def generate_racks(containers: List[Container]) -> List[Rack]:
    """Generate Rack bounding boxes from containers"""
    
    # Group by row
    rack_groups = defaultdict(list)
    for c in containers:
        rack_groups[c.row].append(c)
    
    racks = []
    for row, row_containers in rack_groups.items():
        if not row_containers:
            continue
        
        # Calculate bounding box
        min_x = min(c.position['x'] for c in row_containers)
        max_x = max(c.position['x'] + c.dimensions['x'] for c in row_containers)
        min_y = min(c.position['y'] for c in row_containers)
        max_y = max(c.position['y'] + c.dimensions['y'] for c in row_containers)
        min_z = min(c.position['z'] for c in row_containers)
        max_z = max(c.position['z'] + c.dimensions['z'] for c in row_containers)
        
        sections = sorted(set(c.section for c in row_containers))
        max_level = max(c.level for c in row_containers)
        
        rack = Rack(
            id=f"R{row}",
            row=row,
            sections=sections,
            max_level=max_level,
            container_count=len(row_containers),
            bounds_min={'x': min_x, 'y': min_y, 'z': min_z},
            bounds_max={'x': max_x, 'y': max_y, 'z': max_z}
        )
        racks.append(rack)
    
    return racks


# ============================================================================
# MAIN PROCESSING
# ============================================================================

def process_bay(df: pd.DataFrame, building: str, bay: str, config: Config) -> BayData:
    """Process all data for a single bay"""
    
    bay_data = BayData(building=building, bay=bay)
    
    # Check data completeness
    is_complete, completeness_errors = check_bay_data_completeness(df, bay)
    
    if not is_complete:
        bay_data.errors.extend(completeness_errors)
        return bay_data
    
    bay_data.warnings.extend(completeness_errors)  # Partial data warnings
    
    # Validate shelf heights and get warnings/info
    _, height_warnings, height_info = validate_shelf_heights(df, bay, config)
    
    # Add info messages first (like summary)
    bay_data.warnings.extend(height_info)
    # Add specific warnings
    bay_data.warnings.extend(height_warnings)
    
    # Generate containers
    containers, gen_warnings = generate_containers(df, bay, config)
    bay_data.containers = containers
    bay_data.warnings.extend(gen_warnings)
    
    # Generate racks
    bay_data.racks = generate_racks(containers)
    
    return bay_data


def process_excel(filepath: str, config: Config, sheet_name: str = None) -> Dict[str, Dict[str, BayData]]:
    """
    Process Excel file and return data organized by building -> bay
    
    Returns: Dict[building_key, Dict[bay, BayData]]
    """
    results = defaultdict(dict)
    
    # Load and validate
    df, load_errors = load_and_validate_excel(filepath, sheet_name)
    
    if any("CRITICAL" in e for e in load_errors):
        # Return error structure
        error_data = BayData(building="UNKNOWN", bay="UNKNOWN")
        error_data.errors = load_errors
        results["UNKNOWN"]["UNKNOWN"] = error_data
        return dict(results)
    
    # Get unique buildings and bays
    buildings = df['BLDG'].dropna().unique()
    bays = df['AREA (BAY)'].dropna().unique()
    
    for building in buildings:
        building_key = building.replace(' ', '').lower()  # "BLDG 22" -> "bldg22"
        
        for bay in bays:
            bay_df = df[(df['BLDG'] == building) & (df['AREA (BAY)'] == bay)]
            
            if len(bay_df) > 0:
                bay_data = process_bay(df, building, bay, config)
                results[building_key][bay] = bay_data
    
    return dict(results)


def save_results(results: Dict[str, Dict[str, BayData]], output_dir: str):
    """Save results as one JSON file per bay"""
    
    os.makedirs(output_dir, exist_ok=True)
    
    for building_key, bays in results.items():
        for bay, bay_data in bays.items():
            filename = f"{building_key}_bay{bay}_containers.json"
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, 'w') as f:
                json.dump(bay_data.to_dict(), f, indent=2)
            
            # Print summary
            status = "✓" if not bay_data.errors else "✗"
            print(f"{status} {filename}: {len(bay_data.containers)} containers, {len(bay_data.racks)} racks")
            
            if bay_data.errors:
                for err in bay_data.errors:
                    print(f"    ERROR: {err}")
            
            if bay_data.warnings:
                # Check for summary message
                summary = [w for w in bay_data.warnings if w.startswith("SUMMARY:")]
                height_warnings = [w for w in bay_data.warnings if "Height mismatch" in w]
                other_warnings = [w for w in bay_data.warnings if w not in summary and w not in height_warnings]
                
                if summary:
                    print(f"    {summary[0]}")
                    if len(height_warnings) <= 3:
                        for w in height_warnings:
                            print(f"      - {w}")
                
                if other_warnings:
                    if len(other_warnings) <= 5:
                        for w in other_warnings:
                            print(f"    WARNING: {w}")
                    else:
                        print(f"    ({len(other_warnings)} other warnings - see JSON for details)")


# ============================================================================
# CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Generate warehouse container JSON files from Excel inventory data'
    )
    parser.add_argument('input_file', help='Input Excel file path')
    parser.add_argument('--output-dir', '-o', default='./output', 
                       help='Output directory for JSON files')
    parser.add_argument('--sheet', '-s', default=None,
                       help='Sheet name to read (auto-detects if not specified)')
    parser.add_argument('--shelf-thickness', type=float, default=3.0,
                       help='Shelf thickness in inches (default: 3.0)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose output')
    
    args = parser.parse_args()
    
    # Initialize config
    config = Config(shelf_thickness_inches=args.shelf_thickness)
    
    print(f"Processing: {args.input_file}")
    print(f"Config: shelf_thickness={config.shelf_thickness_inches}in, "
          f"level_1_offset={config.level_1_floor_offset_inches}in")
    print()
    
    # Process
    results = process_excel(args.input_file, config, args.sheet)
    
    # Save
    save_results(results, args.output_dir)
    
    print()
    print(f"Output saved to: {args.output_dir}/")


if __name__ == '__main__':
    main()
