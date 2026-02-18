// types/InventoryApi.ts
export type InventoryApi = {
  indocn: string;              // transfer order
  lofull: string;              // fullness indicator (string in API)
  inavlq: string;              // available qty (string in API)

  itemdp: string;              // item depth
  itemht: string;              // item height
  itemwd: string;              // item width

  lolocn: string;              // bin/location identifier (e.g. 3W34A03)
  skskun: string;              // SKU number
  skpart: string;              // internal SKU part number
  innumb: string;              // internal inventory number

  imageUrl?: string | null;     // NEW: optional image URL
  
  rackImageUrl?: string | null;
  status: "success" | string;  // success or error message
};




/** CHANCGES FROM ORIGINAL SPRING BOOT TEST REST API
 * Changed this data to incude item size and only reference to container
 * 
 * Original Values included:
 * the data items returned are
"skskun" =  "sku" SKU number
"skpart" =  "sku" internal SKU part number
"innumb" =  "invt" internal Inventory number
"indocn" =  "invt" the Transfer Order number that sent the material to the location
"inavlq" =  "invt" the current available quantity
"lolowd" =  "locn" location width
"lolodp" =  "locn" location depth, front to back
"loloht" =  "locn" location height
"lofull" =  "locn" fullness indicator
"status" =  "success" or "error message" < not part of seer>

NEEDED TO MAKE DISTINCTION IN WHERE WE GET THE "CONTAINER" SIZE vs "Item "Size

 */