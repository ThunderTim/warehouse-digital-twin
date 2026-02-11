#!/usr/bin/env python3
"""
export_containers.py

Build JSON for 3D visualization from Excel/CSV inventory-position export.

Output structure:

BUILDING.json
{
  building: "BLDG 22",
  units: "ft",
  level_pitch_ft: 4.0,
  bays: [
    {
      id: "3E",
      origin: [0,0,0],
      containers: [
        {
          id: "3E03A4",
          valid: true,
          location: { x,y,z },
          dimensions: { width,height,depth },
          row,
          section,
          level,
          position
        }
      ]
    }
  ]
}

Usage:

pip install pandas openpyxl

Excel:
python export_containers.py --input "file.xlsx" --sheet "bldg22(bay3)" --out ./out

CSV:
python export_containers.py --input "file.csv" --out ./out
"""

import argparse
import json
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import pandas as pd


# =============================
# DEFAULT COLUMN NAMES
# =============================
BIN_COL = "Storage Bin"
BLDG_COL = "BLDG"
BAY_COL = "AREA (BAY)"
X_COL = "POS X (ft)"
Y_COL = "POS Y"
ROW_COL = "ROW"
SECT_COL = "SECT"
LEVEL_COL = "LEVEL"
POS_COL = "POSITION "
W_COL = "Width (ft)"
H_COL = "Height (ft)"
D_COL = "Depth (ft)"


@dataclass
class ExportConfig:
    level_pitch_ft: float
    z_mode: str  # "pitch" or "centered"


# =============================
# HELPERS
# =============================

def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def read_input(path: str, sheet: Optional[str]):
    ext = os.path.splitext(path)[1].lower()
    if ext == ".csv":
        return pd.read_csv(path)
    elif ext in (".xlsx", ".xlsm", ".xls"):
        xl = pd.ExcelFile(path)
        sheet_to_use = sheet or xl.sheet_names[0]
        return pd.read_excel(path, sheet_name=sheet_to_use)
    else:
        raise ValueError("Unsupported file type")


def coerce_numeric(df, cols):
    for c in cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")


def first_non_null(series):
    s = series.dropna()
    return s.iloc[0] if len(s) else None


def compute_z(level, height, cfg: ExportConfig):
    if level is None or pd.isna(level):
        return None
    z = (float(level) - 1.0) * cfg.level_pitch_ft
    if cfg.z_mode == "centered" and height is not None and not pd.isna(height):
        z += float(height) / 2.0
    return z


def num(v):
    if v is None or pd.isna(v):
        return None
    return float(v)


def integer(v):
    if v is None or pd.isna(v):
        return None
    return int(float(v))


# =============================
# CORE EXPORT
# =============================

def export_containers(input_path, out_dir, sheet, cfg: ExportConfig):

    ensure_dir(out_dir)

    df = read_input(input_path, sheet)

    # Clean + numeric coercion
    coerce_numeric(df, [X_COL, Y_COL, LEVEL_COL, W_COL, H_COL, D_COL])

    df[BIN_COL] = df[BIN_COL].astype(str).str.strip()
    df = df[df[BIN_COL] != ""]

    grouped = df.groupby(BIN_COL)

    rows = []

    for bin_id, sub in grouped:

        building = first_non_null(sub[BLDG_COL]) if BLDG_COL in sub else None
        bay = first_non_null(sub[BAY_COL]) if BAY_COL in sub else None

        x = first_non_null(sub[X_COL]) if X_COL in sub else None
        y = first_non_null(sub[Y_COL]) if Y_COL in sub else None
        level = first_non_null(sub[LEVEL_COL]) if LEVEL_COL in sub else None
        width = first_non_null(sub[W_COL]) if W_COL in sub else None
        height = first_non_null(sub[H_COL]) if H_COL in sub else None
        depth = first_non_null(sub[D_COL]) if D_COL in sub else None

        row_val = first_non_null(sub[ROW_COL]) if ROW_COL in sub else None
        sect_val = first_non_null(sub[SECT_COL]) if SECT_COL in sub else None
        pos_val = first_non_null(sub[POS_COL]) if POS_COL in sub else None

        z = compute_z(level, height, cfg)

        valid = all(v is not None for v in [x, y, z, width, height, depth])

        rows.append({
            "id": bin_id,
            "building": building,
            "bay": bay,
            "x": x,
            "y": y,
            "z": z,
            "width": width,
            "height": height,
            "depth": depth,
            "row": row_val,
            "section": sect_val,
            "level": level,
            "position": pos_val,
            "valid": valid
        })

    agg = pd.DataFrame(rows)

    # =============================
    # BUILDING STRUCTURE
    # =============================

    buildings = agg["building"].dropna().unique()
    if len(buildings) == 0:
        buildings = ["UNKNOWN"]
        agg["building"] = "UNKNOWN"

    for bldg in buildings:

        bdf = agg[agg["building"] == bldg]
        bays = bdf["bay"].dropna().unique()

        bay_objects = []

        for bay in bays:

            cdf = bdf[bdf["bay"] == bay]

            containers = []

            for _, r in cdf.iterrows():
                containers.append({
                    "id": r["id"],
                    "valid": r["valid"],
                    "location": {
                        "x": num(r["x"]),
                        "y": num(r["y"]),
                        "z": num(r["z"])
                    },
                    "dimensions": {
                        "width": num(r["width"]),
                        "height": num(r["height"]),
                        "depth": num(r["depth"])
                    },
                    "row": r["row"],
                    "section": r["section"],
                    "level": integer(r["level"]),
                    "position": r["position"]
                })

            bay_objects.append({
                "id": bay,
                "origin": [0.0, 0.0, 0.0],
                "containers": containers
            })

        payload = {
            "building": bldg,
            "units": "ft",
            "level_pitch_ft": cfg.level_pitch_ft,
            "bays": bay_objects
        }

        filename = f"{str(bldg).replace(' ', '_')}.json"
        out_path = os.path.join(out_dir, filename)

        with open(out_path, "w") as f:
            json.dump(payload, f, indent=2)

        print(f"Exported {out_path}")


# =============================
# MAIN
# =============================

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", default="./out_containers")
    parser.add_argument("--sheet", default=None)
    parser.add_argument("--level-pitch", type=float, default=4.0)
    parser.add_argument("--z-mode", choices=["pitch", "centered"], default="pitch")

    args = parser.parse_args()

    cfg = ExportConfig(
        level_pitch_ft=args.level_pitch,
        z_mode=args.z_mode
    )

    export_containers(
        input_path=args.input,
        out_dir=args.out,
        sheet=args.sheet,
        cfg=cfg
    )


if __name__ == "__main__":
    main()
