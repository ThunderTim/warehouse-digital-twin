//InventoryDropDown.tsx


import type { Inventory } from "../types/Inventory";

type Props = {
  items: Inventory[];
  selectedSku: string;
  onChangeSku: (sku: string) => void;
};

export function InventoryDropdown({ items, selectedSku, onChangeSku }: Props) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>Inventory</span>

      <select
        value={selectedSku}
        onChange={(e) => onChangeSku(e.target.value)}
        style={{ padding: 8, borderRadius: 6 }}
      >
        <option value="">Please select...</option>

        {items.map((it) => (
          <option key={it.sku} value={it.sku}>
            {it.skuPart} — bin {it.binId} (qty {it.availableQty})
          </option>
        ))}
      </select>
    </label>
  );
}
