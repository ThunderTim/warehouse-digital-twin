# Warehouse Visualization Tool - v2

## Client-Confirmed Data Structure

### Location Label Format
```
3W-26-D-02-01
│  │  │  │  └─ Slot position (01 = first slot, left to right)
│  │  │  └──── Level/Elevation (02 = second level from floor)
│  │  └─────── Section (D = section of rack)
│  └────────── Rack Row (26)
└───────────── Bay (3W = Bay 3, West side)
```

### Coordinate System
| Source | Three.js Axis | Direction |
|--------|---------------|-----------|
| POS X (ft) | X | Left → Right (positive = east) |
| POS Y (ft) | Z | Depth (positive = north, into warehouse) |
| Level | Y | Up (floor = 0, positive = up) |

**Bay Origin:** Each bay's coordinates are relative to its own origin marker at the **top-left (westernmost & southernmost point)** of that bay. Position the bay marker in your 3D scene and the containers will be placed relative to it.

### Key Settings (Configurable)
- **Shelf thickness**: 3 inches (between levels)
- **Level 1 offset**: 2 inches (floor clearance)
- **Units output**: Feet (1 Three.js unit = 1 foot)
- **Slots per section**: Up to 8 (A through H)

## Tool Usage

### Basic Usage
```bash
python warehouse_generator_v2.py input.xlsx --output-dir ./output
```

### Options
```bash
--output-dir, -o    Output directory (default: ./output)
--sheet, -s         Sheet name to read (auto-detects if not specified)
--shelf-thickness   Shelf thickness in inches (default: 3.0)
--verbose, -v       Verbose output
```

### Sheet Auto-Detection
The tool automatically finds the correct sheet by looking for sheets with 'bay' or 'bldg' in the name. You can also specify explicitly:
```bash
python warehouse_generator_v2.py input.xlsx --sheet "bldg22(bay3)"
```

### Output Files
One JSON file per bay:
- `bldg22_bay3E_containers.json`
- `bldg22_bay3W_containers.json` (with error if missing data)

## Data Validation

### Height Conformity Checking
The tool validates that **all sections within the same row/level have consistent shelf heights**. 

If sections differ, you'll see warnings like:
```
SUMMARY: 5 row/level combinations have inconsistent shelf heights
  Row 09, Level 1: Height mismatch - expected 56.0" (2 sections) but found: 11.0" in section(s) A
```

**Why this matters:** 
- Shelf heights determine Y position calculations
- Inconsistent heights may indicate data entry errors
- The tool uses the **most common height** as the "correct" one

### Missing Position Data
If a bay is missing X/Y coordinate data:
```json
{
  "errors": ["Bay 3W: MISSING POSITION DATA - 135 containers have no X/Y coordinates"],
  "containers": [],
  "racks": []
}
```

## Output JSON Structure

```json
{
  "building": "BLDG 22",
  "bay": "3E",
  "bay_origin": {
    "x": 0, "y": 0, "z": 0,
    "note": "Origin is at top-left of bay (westernmost & southernmost point)"
  },
  "metadata": {
    "total_containers": 508,
    "total_racks": 17,
    "units": "feet",
    "coordinate_system": {
      "x": "horizontal (left-right, positive = east)",
      "y": "vertical (height, 0 = floor, positive = up)",
      "z": "depth (positive = north, into warehouse)"
    }
  },
  "containers": [
    {
      "id": "3E01A1A",
      "row": "01",
      "section": "A", 
      "level": 1,
      "slot": "A",
      "position": {"x": 35.875, "y": 0.1667, "z": -8.21},
      "dimensions": {"x": 0.375, "y": 0.9167, "z": 1.5}
    }
  ],
  "racks": [
    {
      "id": "R01",
      "row": "01",
      "sections": ["A", "B", "C", ...],
      "max_level": 6,
      "container_count": 69,
      "bounds": {
        "min": {"x": 35.88, "y": 0.17, "z": -49.88},
        "max": {"x": 38.88, "y": 1.08, "z": -6.71}
      },
      "center": {"x": 37.38, "y": 0.62, "z": -28.29}
    }
  ],
  "errors": [],
  "warnings": [...]
}
```

## How Coordinates Are Calculated

### Units
**All output is in FEET (1 Three.js unit = 1 foot)**
- POS X and POS Y from Excel are already in feet → used directly
- Dimensions in inches → converted to feet (÷ 12)

### X Position (Horizontal)
```
x = POS_X_ft + (slot_index × slot_width_ft)

Where:
- slot_width_ft = section_width_inches / 12 / 8
- For 36" sections: slot_width = 0.375 ft (4.5")
- slot_index: A=0, B=1, C=2, ... H=7
```

### Y Position (Height)
```
y = floor_offset_ft + Σ(heights_of_levels_below_ft) + Σ(shelf_thicknesses_ft)

For Level 1: y = 0.1667 ft (2")
For Level 2: y = 1.333 ft (2" + 11" + 3" = 16")  
For Level 3: y = 2.5 ft (16" + 11" + 3" = 30")
```

### Z Position (Depth)
```
z = POS_Y_ft  (used directly, negative values = into warehouse)
```

## Multi-Building/Bay Support

The tool automatically handles multiple buildings and bays:
- Reads `BLDG` column to identify building
- Reads `AREA (BAY)` column to identify bay
- Generates one JSON per bay: `{building}_bay{bay}_containers.json`

**Example:** A spreadsheet with BLDG 22 and BLDG 23, each with bays 1E, 1W, 2E, 2W would generate:
```
bldg22_bay1E_containers.json
bldg22_bay1W_containers.json
bldg22_bay2E_containers.json
bldg22_bay2W_containers.json
bldg23_bay1E_containers.json
...
```

## Test Results (Completed Spreadsheet)

| Bay | Containers | Racks | Height Issues | Status |
|-----|------------|-------|---------------|--------|
| 3E  | 508        | 17    | 5 row/levels  | ✓ Complete |
| 3W  | 119        | 15    | -             | ✓ Complete |

### Position Ranges (for reference)
| Bay | X Range | Y Range | Z Range |
|-----|---------|---------|---------|
| 3E  | 3.5 to 56.4 ft | 0.17 to 10.0 ft | -61.2 to -3.8 ft |
| 3W  | 3.5 to 56.8 ft | 0.17 to 8.5 ft | -77.5 to 74.0 ft |

## Integration with Three.js/R3F

**All coordinates are in feet (1 unit = 1 foot)**

In your Three.js scene:
1. Place bay marker at scene origin (0,0,0)
2. Load `bldg22_bay3E_containers.json`
3. For each container, create a Box mesh:
```jsx
// Position and dimensions are already in feet
<mesh position={[c.position.x, c.position.y, c.position.z]}>
  <boxGeometry args={[c.dimensions.x, c.dimensions.y, c.dimensions.z]} />
</mesh>
```

4. For rack hotboxes:
```jsx
const size = [
  rack.bounds.max.x - rack.bounds.min.x,
  rack.bounds.max.y - rack.bounds.min.y,
  rack.bounds.max.z - rack.bounds.min.z
];
<mesh position={[rack.center.x, rack.center.y, rack.center.z]}>
  <boxGeometry args={size} />
</mesh>
```

## Notes

- **Units are FEET** (1 Three.js unit = 1 foot)
- Containers without position data are skipped (not included in output)
- Special bins (ENDCAP, BACKAREA, etc.) are skipped with warning
- Level is parsed from bin name (not Excel LEVEL column) to avoid mismatches
- Dimensions default to 36"×11"×18" (3ft × 0.917ft × 1.5ft) if missing
- Height mismatches are flagged but processing continues using most common height
