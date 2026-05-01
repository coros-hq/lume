import { ActionCall } from '../types'

export function parseActionCall(raw: string): ActionCall | null {
  // find the outermost {...} block by tracking brace depth
  const start = raw.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let end = -1
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++
    else if (raw[i] === '}') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }

  if (end === -1) return null

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1))
    if (
      parsed &&
      typeof parsed.action === 'string' &&
      typeof parsed.parameters === 'object' &&
      parsed.parameters !== null
    ) {
      return { action: parsed.action, parameters: parsed.parameters }
    }
  } catch {
    // not valid JSON
  }

  return null
}