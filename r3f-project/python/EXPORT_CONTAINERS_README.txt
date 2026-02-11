EXPORT CONTAINERS SCRIPT
========================

Purpose
-------
Creates JSON used to reconstruct 3D container boxes in WebGL.

Structure:
Building -> Bays -> Containers

Why building is top level:
- Inventory feed includes container id (lolocn) but NOT building.
- This lets you map inventory data cleanly to the correct building.

Install
-------
pip install pandas openpyxl

Run (Excel)
-----------
python export_containers.py --input "file.xlsx" --sheet "bldg22(bay3)" --out ./out

Run (CSV)
---------
python export_containers.py --input "file.csv" --out ./out

Z Computation
-------------
z = (LEVEL - 1) * level_pitch

Optional centered:
--z-mode centered
This places Z at container center.

Output
------
out/BLDG_22.json

Each container contains:
- id
- valid (false if missing spatial data)
- location {x,y,z}
- dimensions {width,height,depth}
- row
- section
- level
- position

If X/Y are missing (ex: 3W issue), containers still export
but valid = false.
