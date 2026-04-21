import { useState, useRef, useEffect } from 'react'
import { streamFromOllama } from '../providers/OllamaProvider'
import { buildSystemPrompt, ContextObject } from '../core/promptBuilder'
import { Message } from '../types'
import { KnowledgeChunk } from '../core/ragScorer'

interface UseAssistantOptions {
  model?: string
  systemPrompt?: string
  context?: ContextObject
  knowledgeBase?: KnowledgeChunk[]
}

export function useAssistant({
  model = 'gemma3',
  systemPrompt,
  context,
  knowledgeBase
}: UseAssistantOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // always hold the latest context without causing re-renders
  const contextRef = useRef<ContextObject | undefined>(context)
  useEffect(() => {
    contextRef.current = context
  }, [context])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    setError(null)

    const builtPrompt = buildSystemPrompt({
      systemPrompt,
      context: contextRef.current,
      knowledgeBase,      // ← add this
      latestMessage: trimmed, // ← and this
    })

    const userMessage: Message = { role: 'user', content: trimmed }
    const history: Message[] = [
      { role: 'system', content: builtPrompt },
      ...messages.filter(
        m => m.role !== 'system' || m.content.startsWith('[context update]')
      ),
      userMessage,
    ]

    setMessages(prev => [
      ...prev.filter(
        m => m.role !== 'system' || m.content.startsWith('[context update]')
      ),
      userMessage,
      { role: 'assistant', content: '' },
    ])
    setIsStreaming(true)

    abortRef.current = streamFromOllama({
      model,
      messages: history,
      onChunk: (token) => {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + token,
          }
          return updated
        })
      },
      onDone: () => setIsStreaming(false),
      onError: (err) => {
        setIsStreaming(false)
        setError(err.message)
      },
    })
  }

  const pushContext = (note: string) => {
    setMessages(prev => [
      ...prev,
      // stored as a system message — never shown in UI
      { role: 'system', content: `[context update] ${note}` },
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
  }

  return { messages, isStreaming, error,pushContext, send, stop, clearHistory }
}