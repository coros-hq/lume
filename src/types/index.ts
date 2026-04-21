import { KnowledgeChunk } from "../core/ragScorer"

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AssistantConfig {
  model?: string
  systemPrompt?: string
  context?: Record<string, string | number | boolean | null | undefined>
  knowledgeBase?: KnowledgeChunk[]
  accentColor?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  title?: string
}
// methods the host app can call via ref
export interface AssistantHandle {
  open: () => void
  close: () => void
  toggle: () => void
  pushContext: (note: string) => void
  clearHistory: () => void
}