import { Trash2, X } from "lucide-react";

const iconBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export function Header({
  title,
  accentColor,
  onClose,
  onClear,
  hasMessages,
}: {
  onClose: () => void
  onClear: () => void
  hasMessages: boolean
  title?: string
  accentColor?: string

}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: accentColor || '#6366f1',
        boxShadow: '0 0 6px #6366f1',
      }} />
      <span style={{
        flex: 1,
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: 600,
      }}>
        {title || "Assistant"}
      </span>
      {hasMessages && (
        <button onClick={onClear} style={iconBtnStyle} title="Clear conversation">
          <Trash2 size={15} color="rgba(255,255,255,0.4)" />
        </button>
      )}
      <button onClick={onClose} style={iconBtnStyle}>
        <X size={16} color="rgba(255,255,255,0.5)" />
      </button>
    </div>
  )
}