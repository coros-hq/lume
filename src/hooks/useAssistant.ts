import { useState, useRef, useEffect } from 'react'
import { streamFromOllama } from '../providers/OllamaProvider'
import { buildTextPrompt, buildActionPrompt, buildComponentPrompt, ContextObject } from '../core/promptBuilder'
import { classifyIntent } from '../core/intentClassifier'
import { parseActionCall } from '../core/actionParser'
import { parseComponentCall } from '../core/componentParser'
import { Message, Action, ConfirmationState, ComponentDefinition } from '../types'
import { KnowledgeChunk } from '../core/ragScorer'

interface UseAssistantOptions {
  model?: string
  systemPrompt?: string
  context?: ContextObject
  knowledgeBase?: KnowledgeChunk[]
  actions?: Action[]
  components?: ComponentDefinition[]
}

const isCarryOver = (m: Message) =>
  m.role !== 'system' || m.content.startsWith('[context update]')

export function useAssistant({
  model = 'qwen2.5',
  systemPrompt,
  context,
  knowledgeBase,
  actions = [],
  components = [],
}: UseAssistantOptions = {}) {
  const [messages, setMessages]         = useState<Message[]>([])
  const [isStreaming, setIsStreaming]    = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<ConfirmationState>({ status: 'idle' })
  const abortRef                        = useRef<AbortController | null>(null)
  const contextRef                      = useRef<ContextObject | undefined>(context)

  useEffect(() => { contextRef.current = context }, [context])



  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
  
    setError(null)
  
    const userMessage: Message = { role: 'user', content: trimmed }
    const baseOptions = {
      systemPrompt,
      context: contextRef.current,
      knowledgeBase,
      latestMessage: trimmed,
    }
  
    setMessages(prev => [
      ...prev.filter(isCarryOver),
      userMessage,
      { role: 'assistant', content: '' },
    ])
    setIsStreaming(true)
  
    // step 1 — classify
    const intent = await classifyIntent({
      model,
      message: trimmed,
      actions,
      components,
    })
  
    const intentLabel =
      intent.type === 'action'    ? `action:${intent.name}` :
      intent.type === 'component' ? `component:${intent.componentType}` :
      'text'
  
    // attach intent to the user message now that we have it
    setMessages(prev => {
      const updated = [...prev]
      // find the user message we just added (second to last — last is the assistant bubble)
      const userIdx = updated.length - 2
      if (userIdx >= 0 && updated[userIdx].role === 'user') {
        updated[userIdx] = { ...updated[userIdx], intent: intentLabel }
      }
      return updated
    })
  
    // step 2 — build prompt and stream (rest unchanged)
    let builtPrompt: string
    if (intent.type === 'action') {
      const matched = actions.find(a => a.name === intent.name)!
      builtPrompt = buildActionPrompt(baseOptions, matched)
    } else if (intent.type === 'component') {
      const matched = components.find(c => c.type === intent.componentType)!
      builtPrompt = buildComponentPrompt(baseOptions, matched)
    } else {
      builtPrompt = buildTextPrompt(baseOptions)
    }
  
    const history: Message[] = [
      { role: 'system', content: builtPrompt },
      ...messages.filter(isCarryOver).map(m => {
        if (m.componentCall) {
          return {
            role: m.role,
            content: `[showed ${m.componentCall.component} component with data: ${JSON.stringify(m.componentCall.props)}]`
          } as Message
        }
        return m
      }),
      userMessage,
    ]
  
    let fullContent = ''
  
    abortRef.current = streamFromOllama({
      model,
      messages: history,
      onChunk: (token) => {
        fullContent += token
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: fullContent }
          return updated
        })
      },
      onDone: () => {
        setIsStreaming(false)
  
        if (intent.type === 'action') {
          const actionCall = parseActionCall(fullContent)
          if (actionCall) {
            const matched = actions.find(a => a.name === actionCall.action)
            if (matched) {
              setMessages(prev => prev.slice(0, -1))
              setConfirmation({ status: 'pending', call: actionCall, action: matched })
              return
            }
          }
        }
  
        if (intent.type === 'component') {
          const componentCall = parseComponentCall(fullContent)
          if (componentCall) {
            const matched = components.find(c => c.type === componentCall.component)
            if (matched) {
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: '', componentCall },
              ])
              return
            }
          }
        }
      },
      onError: (err) => {
        setIsStreaming(false)
        setError(err.message)
        setMessages(prev => prev.slice(0, -1))
      },
    })
  }

  const confirmAction = async () => {
    if (confirmation.status !== 'pending') return
    const { call, action } = confirmation

    setConfirmation({ status: 'executing', call, action })

    try {
      await action.handler(call.parameters as any)
      setConfirmation({ status: 'idle' })
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `✓ Done — ${action.description.toLowerCase()}.` },
      ])
    } catch (err) {
      setConfirmation({ status: 'idle' })
      setError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  const cancelAction = () => {
    setConfirmation({ status: 'idle' })
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: 'Action cancelled.' },
    ])
  }

  const stop = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }

  const clearHistory = () => {
    stop()
    setMessages([])
    setError(null)
    setConfirmation({ status: 'idle' })
  }

  const pushContext = (note: string) => {
    setMessages(prev => [
      ...prev,
      { role: 'system', content: `[context update] ${note}` },
    ])
  }

  return {
    messages,
    isStreaming,
    error,
    confirmation,
    send,
    stop,
    clearHistory,
    pushContext,
    confirmAction,
    cancelAction,
  }
}