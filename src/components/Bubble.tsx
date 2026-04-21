import { MessageCircle, X } from 'lucide-react'

interface BubbleProps {
  isOpen: boolean
  onClick: () => void
  accentColor: string
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

function Bubble({ isOpen, onClick, accentColor, position }: BubbleProps) {
  const positionStyle = getPositionStyle(position)

  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
      style={{
        position: 'fixed',
        ...positionStyle,
        zIndex: 9999,
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: accentColor,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 20px ${accentColor}80`,
        transition: 'transform 0.15s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {isOpen ? <X size={20} color="white" /> : <MessageCircle size={22} color="white" />}
    </button>
  )
}

function getPositionStyle(position: string): React.CSSProperties {
  switch (position) {
    case 'bottom-left':  return { bottom: 24, left: 24 }
    case 'top-right':    return { top: 24, right: 24 }
    case 'top-left':     return { top: 24, left: 24 }
    default:             return { bottom: 24, right: 24 }
  }
}

export default Bubble