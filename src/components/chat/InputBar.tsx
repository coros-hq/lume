import { KeyboardEvent } from "react";

interface InputBarProps {
  value: string
  onChange: (val: string) => void
  onSend: () => void
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  isStreaming: boolean
  accentColor?: string
}

export function InputBar({ value, onChange, onSend, onKeyDown, isStreaming, accentColor }: InputBarProps) {
  const canSend = value.trim().length > 0 && !isStreaming

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: 8,
      padding: '10px 12px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
    }}>
      <textarea
        rows={1}
        placeholder={isStreaming ? 'Responding…' : 'Ask anything…'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        style={{
          flex: 1,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '8px 12px',
          color: 'rgba(255,255,255,0.9)',
          fontSize: 13,
          resize: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.5,
        }}
      />
      <button
        onClick={onSend}
        disabled={!canSend}
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: canSend ? (accentColor || '#6366f1') : 'rgba(255,255,255,0.06)',
          border: 'none',
          cursor: canSend ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.15s ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  )
}