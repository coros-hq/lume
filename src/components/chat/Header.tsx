import { Trash2, X } from 'lucide-react'
import { OllamaStatus } from '../../hooks/useOllamaStatus'

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 4,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const STATUS_CONFIG: Record<OllamaStatus, { color: string; pulse: boolean; tooltip: string }> = {
  checking:    { color: '#facc15', pulse: true,  tooltip: 'Connecting to Ollama...' },
  connected:   { color: '#4ade80', pulse: false, tooltip: 'Connected' },
  unreachable: { color: '#f87171', pulse: false, tooltip: 'Ollama not reachable — run: ollama serve' },
}

export function Header({
  title,
  accentColor,
  onClose,
  onClear,
  hasMessages,
  status = 'checking',
}: {
  onClose: () => void
  onClear: () => void
  hasMessages: boolean
  title?: string
  accentColor?: string
  status?: OllamaStatus
}) {
  const { color, pulse, tooltip } = STATUS_CONFIG[status]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
    }}>

      {/* status dot */}
      <div
        title={tooltip}
        style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
          animation: pulse ? 'lume-pulse 1.2s ease-in-out infinite' : 'none',
          flexShrink: 0,
          cursor: 'default',
        }}
      />

      <style>{`
        @keyframes lume-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

      <span style={{
        flex: 1,
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: 600,
      }}>
        {title || 'Assistant'}
      </span>

      {/* unreachable hint */}
      {status === 'unreachable' && (
        <span style={{
          fontSize: 11,
          color: '#f87171',
          background: 'rgba(248,113,113,0.1)',
          padding: '2px 8px',
          borderRadius: 20,
          whiteSpace: 'nowrap',
        }}>
          Ollama offline
        </span>
      )}

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