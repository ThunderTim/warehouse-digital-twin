// types/Inventory.ts
export type Inventory = {
  sku: string;
  skuPart: string;
  inventoryNumber: string;
  transferOrderNumber: string;

  binId: string;        // lolocn
  availableQty: number; // inavlq

  item: {
    width: number;
    depth: number;
    height: number;
  };

  fullness: number;     // 
  
  imageUrl?: string; 
  rackImageUrl?: string;

  ok: boolean;
  errorMessage?: string;
};
