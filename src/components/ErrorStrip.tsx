export function ErrorStrip({ message }: { message: string }) {
    return (
      <div style={{
        margin: '0 12px 8px',
        padding: '8px 12px',
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 8,
        color: '#fca5a5',
        fontSize: 12,
      }}>
        ⚠ {message}
      </div>
    )
  }