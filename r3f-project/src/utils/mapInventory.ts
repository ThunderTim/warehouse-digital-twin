// utils/mapInventory.ts
import type { InventoryApi } from "../types/InventoryApi";
import type { Inventory } from "../types/Inventory";

function toNumber(v: string, field: string): number {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid number for ${field}: ${v}`);
  return n;
}

function normalizeUrl(v?: string | null): string | undefined {
  const s = (v ?? "").trim();
  return s.length ? s : undefined;
}

export function mapInventory(api: InventoryApi): Inventory {
  const ok = api.status === "success";

  return {
    sku: api.skskun,
    skuPart: api.skpart,
    inventoryNumber: api.innumb,
    transferOrderNumber: api.indocn,

    binId: api.lolocn,
    availableQty: toNumber(api.inavlq, "inavlq"),

    item: {
      width:  toNumber(api.itemwd, "itemwd"),
      depth:  toNumber(api.itemdp, "itemdp"),
      height: toNumber(api.itemht, "itemht"),
    },

    fullness:     toNumber(api.lofull, "lofull"),
    imageUrl:     normalizeUrl(api.imageUrl),
    rackImageUrl: normalizeUrl(api.rackImageUrl), // ← was missing

    ok,
    ...(ok ? {} : { errorMessage: api.status }),
  };
}