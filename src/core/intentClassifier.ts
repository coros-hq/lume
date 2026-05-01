import { Action, ComponentDefinition } from '../types'

const OLLAMA_BASE = 'http://localhost:11434'

interface ClassifyOptions {
  model: string
  message: string
  actions: Action[]
  components: ComponentDefinition[]
}

export type Intent =
  | { type: 'text' }
  | { type: 'action';    name: string }
  | { type: 'component'; componentType: string }

function formatOption(
  key: string,
  description: string,
  examples?: string[]
): string {
  let line = `- ${key} — ${description}`
  if (examples?.length) {
    line += `\n  e.g. ${examples.slice(0, 3).map(e => `"${e}"`).join(', ')}`
  }
  return line
}

export async function classifyIntent({
  model,
  message,
  actions,
  components,
}: ClassifyOptions): Promise<Intent> {
  if (!actions.length && !components.length) return { type: 'text' }

  const options: string[] = [
    formatOption('text', 'general question, greeting, small talk, or conversation'),
  ]

  for (const a of actions) {
    options.push(formatOption(`action:${a.name}`, a.description, a.examples))
  }

  for (const c of components) {
    options.push(formatOption(`component:${c.type}`, c.description, c.examples))
  }

  const prompt =
    `You are an intent classifier. Given a user message, return ONLY the single best matching intent key from the list below.\n` +
    `Return the key exactly as written — nothing else, no explanation, no punctuation.\n\n` +
    `User message: "${message}"\n\n` +
    `Options:\n${options.join('\n')}\n\n` +
    `Answer:`

  try {
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return { type: 'text' }

    const data = await res.json()
    const raw = (data?.message?.content ?? '').trim().toLowerCase()

    if (raw.startsWith('action:')) {
      const name = raw.replace('action:', '').trim()
      const matched = actions.find(a => a.name.toLowerCase() === name)
      if (matched) return { type: 'action', name: matched.name }
    }

    if (raw.startsWith('component:')) {
      const componentType = raw.replace('component:', '').trim()
      const matched = components.find(c => c.type.toLowerCase() === componentType)
      if (matched) return { type: 'component', componentType: matched.type }
    }

    return { type: 'text' }
  } catch {
    return { type: 'text' }
  }
}