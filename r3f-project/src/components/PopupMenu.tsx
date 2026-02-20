export function PopupMenu({
  title,
  options,
  onSelect,
}: {
  title: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 6 }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            style={{
              pointerEvents: "auto",
              textAlign: "left",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              padding: "8px 10px",
              borderRadius: 8,
              cursor: "pointer",
              
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
