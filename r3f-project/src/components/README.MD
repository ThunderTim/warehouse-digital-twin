
App.tsx.
show main Campus map and messhes 
Load specific building > BuildingLoader.tsx
    - Add buildings as ready in BuildingLoader.tsx
Load Bays VIA Json (BLDG-template-Bay00.json) in > BayContents
    - create individual slots/Containers Via spatial transforms parsed from .xcell
            -should have a "Front" camera location
            - have a render property based on "full %"
    - Create lookup for racks / slots
            ( temp API placeholder inventory.json - check types )
    - Create hiboxes for racks 
        popup Overlay info




JSON SHOULD FOLLOW FORMAT IN "BLDG-template-Bay00.json".  - python parser formatting 


!! set cameras per Building / Bay / Racks or overhead views in CameraController.tsx / CameraPositions.ts