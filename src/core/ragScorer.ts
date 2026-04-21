export interface KnowledgeChunk {
    title: string
    content: string
  }
  
  interface ScoredChunk extends KnowledgeChunk {
    score: number
  }
  
  const STOPWORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
    'can', 'had', 'her', 'was', 'one', 'our', 'out', 'get',
    'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now',
    'see', 'two', 'way', 'who', 'did', 'let', 'put', 'too',
    'use', 'that', 'this', 'with', 'have', 'from', 'they',
    'will', 'been', 'into', 'more', 'also', 'what', 'when',
    'your', 'just', 'some', 'than', 'then', 'them', 'well',
    'were', 'does', 'about', 'which',
  ])
  
  function tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
  }
  
  function scoreChunk(chunkText: string, queryTokens: string[]): number {
    const chunkTokens = tokenize(chunkText)
    if (!chunkTokens.length) return 0
  
    // build a frequency map of the chunk
    const freq: Record<string, number> = {}
    for (const token of chunkTokens) {
      freq[token] = (freq[token] || 0) + 1
    }
  
    // count how many query tokens appear in the chunk
    let hits = 0
    for (const qt of queryTokens) {
      if (freq[qt]) hits += freq[qt]
    }
  
    // normalize by chunk length so long chunks don't always win
    return hits / Math.sqrt(chunkTokens.length)
  }
  
  export function retrieveChunks(
    query: string,
    knowledgeBase: KnowledgeChunk[],
    topN = 3
  ): KnowledgeChunk[] {
    if (!knowledgeBase.length || !query.trim()) return []
  
    const queryTokens = tokenize(query)
    if (!queryTokens.length) return []
  
    const scored: ScoredChunk[] = knowledgeBase.map(chunk => ({
      ...chunk,
      score: scoreChunk(chunk.title + ' ' + chunk.content, queryTokens),
    }))
  
    return scored
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
  }