import { KnowledgeChunk, retrieveChunks } from './ragScorer'

export interface ContextObject {
  [key: string]: string | number | boolean | null | undefined
}

interface BuildPromptOptions {
  systemPrompt?: string
  context?: ContextObject
  knowledgeBase?: KnowledgeChunk[]
  latestMessage?: string
}

export function buildSystemPrompt({
  systemPrompt,
  context,
  knowledgeBase,
  latestMessage,
}: BuildPromptOptions): string {
  const parts: string[] = []

  // Layer 1: base persona
  if (systemPrompt?.trim()) {
    parts.push(systemPrompt.trim())
  } else {
    parts.push('You are a helpful assistant embedded in this application.')
  }

  // Layer 2: page/app context
  if (context && Object.keys(context).length > 0) {
    const lines = Object.entries(context)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').toLowerCase()
        return `- ${label}: ${value}`
      })

    if (lines.length > 0) {
      parts.push(`Current app context:\n${lines.join('\n')}`)
    }
  }

  // Layer 3: RAG chunks
  if (knowledgeBase?.length && latestMessage) {
    const chunks = retrieveChunks(latestMessage, knowledgeBase, 3)
    if (chunks.length) {
      const chunkText = chunks
        .map(c => `[${c.title}]\n${c.content}`)
        .join('\n\n')
      parts.push(`Relevant documentation:\n${chunkText}`)
    }
  }

  // Layer 4: behaviour rules
  parts.push(
    'Keep responses concise and conversational — this is a chat widget. ' +
    'Use markdown only for code blocks and short lists.'
  )

  return parts.join('\n\n')
}