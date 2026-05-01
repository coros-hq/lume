export interface ComponentCall {
  component: string
  props: Record<string, unknown>
}

export function parseComponentCall(raw: string): ComponentCall | null {
  // strip markdown code fences
  const stripped = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  // find the outermost {...} block correctly by tracking brace depth
  const start = stripped.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let end = -1
  for (let i = start; i < stripped.length; i++) {
    if (stripped[i] === '{') depth++
    else if (stripped[i] === '}') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }

  if (end === -1) return null

  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1))
    if (
      parsed &&
      typeof parsed.component === 'string' &&
      typeof parsed.props === 'object' &&
      parsed.props !== null
    ) {
      return { component: parsed.component, props: parsed.props }
    }
  } catch {
    // not valid JSON
  }

  return null
}