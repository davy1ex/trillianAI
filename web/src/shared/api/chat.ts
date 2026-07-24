export interface DonePayload {
  conversationId: string
  messageId: string
}

export interface ChatEventHandlers {
  onContent: (content: string) => void
  onReasoning: (content: string) => void
  onDone: (payload: DonePayload) => void
  onError: (error: string) => void
}

export function sendChatMessageSSE(
  prompt: string,
  conversationId: string,
  handlers: ChatEventHandlers,
  reasoningLevel = 'on',
  baseUrl?: string,
  modelName?: string,
  systemPrompt?: string,
): () => void {
  const controller = new AbortController()

  const body = JSON.stringify({ prompt, conversationId, reasoningLevel, baseUrl, modelName, systemPrompt })

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: controller.signal,
  }).then(async (response) => {
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }))
      handlers.onError(err.error ?? 'Unknown error')
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      handlers.onError('No response body')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let currentEvent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
          continue
        }
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          try {
            const parsed = JSON.parse(data)
            if (currentEvent === 'content') {
              handlers.onContent(parsed.content)
            } else if (currentEvent === 'reasoning') {
              handlers.onReasoning(parsed.content)
            } else if (currentEvent === 'done') {
              handlers.onDone(parsed as DonePayload)
            } else if (currentEvent === 'error') {
              handlers.onError(parsed.error)
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') {
      handlers.onError(err.message)
    }
  })

  return () => controller.abort()
}
