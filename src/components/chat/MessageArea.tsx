import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { ComponentDefinition, Message } from '../../types'
import { ComponentRenderer } from '../ComponentRenderer'

function TypingLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 2px' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            animation: 'lume-bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes lume-bounce {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40%            { opacity: 1;    transform: translateY(-3px); }
        }
      `}</style>
    </div>
  )
}

function IntentBadge({ intent }: { intent: string }) {
  const isAction    = intent.startsWith('action:')
  const isComponent = intent.startsWith('component:')

  const color = isAction    ? { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8' } :
                isComponent ? { bg: 'rgba(20,184,166,0.15)',   text: '#2dd4bf' } :
                              { bg: 'rgba(255,255,255,0.06)',  text: 'rgba(255,255,255,0.35)' }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
      <span style={{
        fontSize: 10,
        fontFamily: 'monospace',
        padding: '2px 7px',
        borderRadius: 4,
        background: color.bg,
        color: color.text,
      }}>
        {intent}
      </span>
    </div>
  )
}

export function MessageList({
  messages,
  isStreaming,
  components,
  debug = false,
}: {
  messages: Message[]
  isStreaming: boolean
  components: ComponentDefinition[]
  debug?: boolean
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const visible = messages.filter(m => m.role !== 'system')

  if (visible.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13,
      }}>
        Ask me anything
      </div>
    )
  }

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {visible.map((msg, i) => {
        const isLastAssistant = i === visible.length - 1 && msg.role === 'assistant'
        const looksLikeJson   = msg.content.trimStart().startsWith('{')
        const showLoader      = isLastAssistant && isStreaming && looksLikeJson

        if (msg.componentCall) {
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                maxWidth: '88%', padding: '8px 10px',
                borderRadius: '14px 14px 14px 3px',
                background: 'rgba(255,255,255,0.06)',
              }}>
                <ComponentRenderer response={msg.componentCall} components={components} />
              </div>
            </div>
          )
        }

        return (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '80%', padding: '8px 12px',
              borderRadius: msg.role === 'user'
                ? '14px 14px 3px 14px'
                : '14px 14px 14px 3px',
              background: msg.role === 'user'
                ? 'rgba(99,102,241,0.25)'
                : 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.88)',
              fontSize: 13, lineHeight: 1.6, textAlign: 'left',
            }}>
              {showLoader ? (
                <TypingLoader />
              ) : msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>

            {/* debug intent badge — only on user messages */}
            {debug && msg.role === 'user' && msg.intent && (
              <IntentBadge intent={msg.intent} />
            )}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}