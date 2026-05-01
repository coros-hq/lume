import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import Bubble from './Bubble'
import ChatPanel from './ChatPanel'
import { AssistantConfig, AssistantHandle } from '../types'
import { useLumeSafe } from '../context/LumeContext'

type Props = AssistantConfig

export const AssistantWidget = forwardRef<AssistantHandle, Props>(
  function AssistantWidget(props, ref) {
    const provider = useLumeSafe()

    // props always win — fall back to provider config — then defaults
    const model        = props.model        ?? provider?.config.model        ?? 'qwen2.5'
    const systemPrompt = props.systemPrompt ?? provider?.config.systemPrompt ?? 'You are a helpful assistant.'
    const knowledgeBase= props.knowledgeBase?? provider?.config.knowledgeBase
    const actions      = props.actions      ?? provider?.config.actions
    const components   = props.components   ?? provider?.config.components
    const accentColor  = props.accentColor  ?? provider?.config.accentColor  ?? '#6366f1'
    const position     = props.position     ?? provider?.config.position     ?? 'bottom-right'
    const title        = props.title        ?? provider?.config.title        ?? 'Assistant'
    const debug        = props.debug        ?? provider?.config.debug        ?? false

    // merge context: provider live context is base, props.context overrides specific keys
    const context = {
      ...(provider?.context ?? {}),
      ...(props.context ?? {}),
    }

    const [isOpen, setIsOpen] = useState(false)
    const chatRef = useRef<{
      pushContext: (n: string) => void
      clearHistory: () => void
    }>(null)

    const handle: AssistantHandle = {
      open:         () => setIsOpen(true),
      close:        () => setIsOpen(false),
      toggle:       () => setIsOpen(o => !o),
      pushContext:  (note) => chatRef.current?.pushContext(note),
      clearHistory: () => chatRef.current?.clearHistory(),
    }

    useImperativeHandle(ref, () => handle)

    // register with provider so useLume().open() etc work
    useEffect(() => {
      provider?._registerWidget(handle)
      return () => provider?._registerWidget(null)
    }, [])

    return (
      <>
        <ChatPanel
          ref={chatRef}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          model={model}
          systemPrompt={systemPrompt}
          context={context}
          knowledgeBase={knowledgeBase}
          actions={actions}
          components={components}
          accentColor={accentColor}
          position={position}
          title={title}
          debug={debug}
        />
        <Bubble
          isOpen={isOpen}
          onClick={() => setIsOpen(o => !o)}
          accentColor={accentColor}
          position={position}
        />
      </>
    )
  }
)

export default AssistantWidget