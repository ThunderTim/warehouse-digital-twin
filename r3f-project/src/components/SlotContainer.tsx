// SlotContainer.tsx
import { useMemo, useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { Interactable } from "../interaction/Interactable";
import { SlotContainerVisual } from "../Materials/SlotContainerVisual";
import { ImagePreview } from "./ImagePreview";
import type { Inventory } from "../types/Inventory";

type Props = {
  size: [number, number, number];
  fillPct: number;
  shrinkPct?: number;
  slotId?: string;
  rackRef?: string;
  section?: string;
  level?: number;
  isInteractive?: boolean;
  isSelected?: boolean;
  showLabel?: boolean;
  edgeWidth?: number;
  popupMode?: "hover" | "click" | "always";
  items?: Inventory[];
  onClick?: () => void;
};

// ── Fill level color — discrete bands ──────────────────────────────────────
function getFillColor(fillPct: number): string {
  if (fillPct <= 0) return "#22c55e";
  if (fillPct < 0.33) return "#22c55e";
  if (fillPct < 0.55) return "#84cc16";
  if (fillPct < 0.75) return "#f59e0b";
  if (fillPct < 0.9) return "#f97316";
  return "#ef4444";
}

function getFillLabel(fillPct: number): string {
  if (fillPct <= 0) return "Empty";
  if (fillPct < 0.33) return "Low";
  if (fillPct < 0.55) return "Moderate";
  if (fillPct < 0.75) return "Full";
  if (fillPct < 0.9) return "High";
  return "At Capacity";
}

const EDGE_DEFAULT = "#767676";
const EDGE_HOVER = "#ffd400";
const EDGE_SELECTED = "#0bb60b";

function getEdgeColor(isSelected: boolean, hovered: boolean): string {
  if (hovered) return EDGE_HOVER;
  if (isSelected) return EDGE_SELECTED;
  return EDGE_DEFAULT;
}

// ── Item row ───────────────────────────────────────────────────────────────
function ItemRow({ item }: { item: Inventory }) {
  const hasItemImage = !!item.imageUrl;
  const hasRackImage = !!item.rackImageUrl;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: 8,
        padding: "8px 10px",
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{item.skuPart}</div>
          <div style={{ fontSize: 10, opacity: 0.45, marginTop: 1, letterSpacing: "0.04em" }}>
            SKU {item.sku}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 6,
            padding: "3px 7px",
            color: "#fff",
            whiteSpace: "nowrap",
            marginLeft: 8,
          }}
        >
          qty {item.availableQty}
        </div>
      </div>

      <div style={{ fontSize: 10, opacity: 0.4, letterSpacing: "0.03em" }}>
        {item.item.width}W × {item.item.depth}D × {item.item.height}H
      </div>

      <div style={{ fontSize: 10, opacity: 0.35 }}>TO: {item.transferOrderNumber}</div>

      {(hasItemImage || hasRackImage) && (
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          {hasItemImage && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: 56, height: 56, overflow: "hidden", borderRadius: 6, flexShrink: 0 }}>
                <ImagePreview src={item.imageUrl!} alt={item.skuPart} modalTitle={`${item.skuPart} — Item`} />
              </div>
              <span style={{ fontSize: 9, opacity: 0.4, letterSpacing: "0.05em" }}>ITEM</span>
            </div>
          )}

          {hasRackImage && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: 56, height: 56, overflow: "hidden", borderRadius: 6, flexShrink: 0 }}>
                <ImagePreview
                  src={item.rackImageUrl!}
                  alt={`${item.skuPart} rack`}
                  modalTitle={`${item.skuPart} — Rack`}
                />
              </div>
              <span style={{ fontSize: 9, opacity: 0.4, letterSpacing: "0.05em" }}>RACK</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SlotContainer({
  size,
  fillPct,
  shrinkPct = 0.92,
  slotId,
  rackRef,
  section,
  level,
  isInteractive = false,
  isSelected = false,
  showLabel = false,
  edgeWidth = 1.75,
  popupMode = "hover",
  items = [],
  onClick,
}: Props) {
  // SSR-safe portal target (set only on client)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalEl(document.body);
  }, []);

  const dims = useMemo(() => {
    const [w, h, d] = size;
    return { sw: w * shrinkPct, sh: h * shrinkPct, sd: d * shrinkPct };
  }, [size, shrinkPct]);

  const popupOffset = useMemo<[number, number, number]>(() => [0, dims.sh / 2 + 0.3, 0], [dims.sh]);

  const fillColor = getFillColor(fillPct);
  const fillLabel = getFillLabel(fillPct);
  const isEmpty = fillPct <= 0.001;
  const fillPctDisplay = Math.round(fillPct * 100);

  const locationLine = [
    rackRef ? `RACK ${rackRef}` : null,
    section ? `SECTION ${section}` : null,
    level !== undefined ? `LEVEL ${level}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const hoverPopup = (
    <div>
      <strong style={{ fontSize: 13 }}>{slotId}</strong>
      {locationLine && (
        <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2, letterSpacing: "0.05em" }}>{locationLine}</div>
      )}
      <div style={{ fontSize: 12, marginTop: 6, color: isEmpty ? "#888" : fillColor, fontWeight: 600 }}>
        {isEmpty ? "Empty" : `${fillPctDisplay}% filled`}
      </div>
      {items.length > 0 && (
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
          {items.length} item{items.length !== 1 ? "s" : ""} — click to inspect
        </div>
      )}
    </div>
  );

  return (
    <group>
      {/* HTML label in rack view */}
      {showLabel && slotId && (
        <Html position={[0, 0, 0]} center style={{ pointerEvents: "none", userSelect: "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
            {section && (
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 300,
                  fontFamily: "monospace",
                  letterSpacing: "0.08em",
                  lineHeight: "1",
                  backgroundColor: "#000000b7",
                  borderRadius: "8px",
                  padding: "6px 8px",
                  opacity: isEmpty ? 0.6 : 0.9,
                }}
              >
                {section}
              </div>
            )}
            <div
              style={{
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 300,
                fontFamily: "monospace",
                whiteSpace: "nowrap",
                backgroundColor: "#000000b7",
                borderRadius: "8px",
                padding: "6px 8px",
              }}
            >
              {slotId}
            </div>
          </div>
        </Html>
      )}

      {/* Slot view: detail panel portalled to body */}
      {popupMode === "always" && portalEl && (
        <Html portal={{ current: portalEl }} position={[0, 0, 0]}>
          <div
            style={{
              position: "fixed",
              top: "50%",
              right: 24,
              transform: "translateY(-50%)",
              zIndex: 100,
              width: 252,
              maxHeight: "80vh",
              background: "rgba(15, 15, 20, 0.94)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              color: "#fff",
              fontFamily: "system-ui, sans-serif",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                padding: "14px 16px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.09)",
                flexShrink: 0,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>{slotId}</div>
              {locationLine && (
                <div style={{ fontSize: 11, opacity: 0.45, marginTop: 3, letterSpacing: "0.06em" }}>
                  {locationLine}
                </div>
              )}
            </div>

            <div
              style={{
                overflowY: "auto",
                padding: "12px 16px 16px",
                display: "grid",
                gap: 12,
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.15) transparent",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, opacity: 0.45, letterSpacing: "0.06em" }}>FILL LEVEL</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isEmpty ? "#888" : fillColor }}>
                    {isEmpty ? "—" : `${fillPctDisplay}%`}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${fillPctDisplay}%`,
                      borderRadius: 4,
                      background: isEmpty ? "transparent" : fillColor,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <div style={{ marginTop: 5, fontSize: 11, color: isEmpty ? "#666" : fillColor, opacity: 0.85 }}>
                  {fillLabel}
                </div>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                {([
                  { label: "W", value: size[0].toFixed(1) },
                  { label: "H", value: size[1].toFixed(1) },
                  { label: "D", value: size[2].toFixed(1) },
                ] as const).map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 6,
                      padding: "5px 0",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 10, opacity: 0.4, letterSpacing: "0.06em" }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>

              {items.length > 0 ? (
                <div style={{ display: "grid", gap: 6 }}>
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.4,
                      letterSpacing: "0.07em",
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                      paddingTop: 10,
                    }}
                  >
                    CONTENTS ({items.length} ITEM{items.length !== 1 ? "S" : ""})
                  </div>
                  {items.map((item) => (
                    <ItemRow key={item.sku} item={item} />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.4,
                    textAlign: "center",
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                    paddingTop: 10,
                    fontStyle: "italic",
                  }}
                >
                  No inventory data for this slot
                </div>
              )}
            </div>
          </div>
        </Html>
      )}

      <Interactable
        isInteractive={isInteractive}
        onClick={onClick}
        popupOffset={popupOffset}
        popupMode={popupMode === "always" ? "hover" : popupMode}
        popupContent={popupMode === "always" ? undefined : hoverPopup}
      >
        {(hovered) => (
          <SlotContainerVisual
            size={[dims.sw, dims.sh, dims.sd]}
            fillPct={fillPct}
            fillColor={fillColor}
            edgeWidth={hovered || isSelected ? edgeWidth + 0.8 : edgeWidth}
            edgeColor={getEdgeColor(isSelected, hovered)}
            fillOpacity={0.82}
          />
        )}
      </Interactable>
    </group>
  );
}