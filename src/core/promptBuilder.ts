import { Action, ComponentDefinition } from '../types'
import { KnowledgeChunk, retrieveChunks } from './ragScorer'

export interface ContextObject {
  [key: string]: string | number | boolean | null | undefined
}

interface BasePromptOptions {
  systemPrompt?: string
  context?: ContextObject
  knowledgeBase?: KnowledgeChunk[]
  latestMessage?: string
}

// shared base — persona + context + RAG + behaviour rules
function buildBasePrompt({
  systemPrompt,
  context,
  knowledgeBase,
  latestMessage,
}: BasePromptOptions): string[] {
  const parts: string[] = []

  // Layer 1: persona
  parts.push(
    systemPrompt?.trim() ||
    'You are a helpful assistant embedded in this application.'
  )

  // Layer 2: context
  if (context && Object.keys(context).length > 0) {
    const lines = Object.entries(context)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').toLowerCase()
        return `- ${label}: ${value}`
      })
    if (lines.length > 0)
      parts.push(`Current app context:\n${lines.join('\n')}`)
  }

  // Layer 3: RAG chunks
  if (knowledgeBase?.length && latestMessage) {
    const chunks = retrieveChunks(latestMessage, knowledgeBase, 3)
    if (chunks.length) {
      const chunkText = chunks.map(c => `[${c.title}]\n${c.content}`).join('\n\n')
      parts.push(`Relevant documentation:\n${chunkText}`)
    }
  }

  // Layer 4: behaviour rules
  parts.push(
    'Keep responses concise and conversational — this is a chat widget. ' +
    'Use markdown only for code blocks and short lists. ' +
    'NEVER generate any URLs, links, or href values under any circumstances. ' +
    'NEVER make up domain names or website addresses. ' +
    'If you need to direct the user somewhere, refer to the page by name only, e.g. "go to the Billing page".'
  )

  return parts
}

// text prompt — no JSON pressure, just conversation
export function buildTextPrompt(options: BasePromptOptions): string {
  return buildBasePrompt(options).join('\n\n')
}

// action prompt — focused only on the matched action
export function buildActionPrompt(
  options: BasePromptOptions,
  action: Action
): string {
  const parts = buildBasePrompt(options)

  const params = action.parameters
    ? Object.entries(action.parameters)
        .map(([k, v]) => `  - ${k} (${v.type}${v.required ? ', required' : ''}): ${v.description}`)
        .join('\n')
    : '  none'

  parts.push(
    `The user wants to perform this action: ${action.description}\n\n` +
    `Respond with ONLY this JSON and nothing else:\n` +
    `{"action": "${action.name}", "parameters": {<extracted parameters>}}\n\n` +
    `Parameters to extract:\n${params}\n\n` +
    `If a required parameter is missing from the user message, make a reasonable inference from context.\n` +
    `Return ONLY the JSON block — no text before or after.`
  )

  return parts.join('\n\n')
}

// component prompt — focused only on the matched component
export function buildComponentPrompt(
  options: BasePromptOptions,
  component: ComponentDefinition
): string {
  const parts = buildBasePrompt(options)

  const props = component.props
    ? Object.entries(component.props)
        .map(([k, v]) => `  - ${k} (${v.type}${v.required ? ', required' : ''}): ${v.description}`)
        .join('\n')
    : '  none'

  parts.push(
    `The user wants to see: ${component.description}\n\n` +
    `Respond with ONLY this JSON and nothing else:\n` +
    `{"component": "${component.type}", "props": {<filled props>}}\n\n` +
    `Props to fill from context and user data:\n${props}\n\n` +
    `Use the app context above to fill in the values accurately.\n` +
    `Return ONLY the JSON block — no text before or after.`
  )

  return parts.join('\n\n')
}

// keep for backwards compatibility — used nowhere now but safe to keep
export function buildSystemPrompt(options: BasePromptOptions & {
  actions?: Action[]
  components?: ComponentDefinition[]
}): string {
  return buildTextPrompt(options)
}