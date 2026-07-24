import { Router } from 'express'
import * as conversationStore from '../entities/conversation/store'
import * as messageStore from '../entities/message/store'

const router = Router()

const responseIds: Record<string, string> = {}

router.post('/', async (req, res) => {
  const { prompt, conversationId, reasoningLevel = 'on', baseUrl, modelName, systemPrompt } = req.body

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' })
  }

  try {
    const modelKey = modelName || process.env.MODEL_KEY || 'qwen/qwen3-4b-2507'
    const apiBase = baseUrl || process.env.LM_STUDIO_URL || 'http://localhost:1234'

    if (conversationId && !conversationStore.getConversation(conversationId)) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    const cid = conversationId ?? conversationStore.createConversation('New chat').id

    messageStore.addMessage(cid, 'user', prompt)
    const assistantMessage = messageStore.addMessage(cid, 'assistant', '')

    const conv = conversationStore.getConversation(cid)
    const newSystemPrompt = systemPrompt && typeof systemPrompt === 'string' ? systemPrompt : undefined
    if (conv && systemPrompt !== undefined) {
      conversationStore.updateConversationSystemPrompt(cid, systemPrompt)
    }

    const prevResponseId = responseIds[cid]

    async function callLmStudio(level: string) {
      const body: Record<string, any> = {
        model: modelKey,
        input: prompt,
        stream: true,
        reasoning: level,
        store: true,
      }
      if (newSystemPrompt) body.system_prompt = newSystemPrompt
      if (prevResponseId) body.previous_response_id = prevResponseId

      return await fetch(`${apiBase}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }

    const validLevels = ['off', 'low', 'medium', 'high', 'on']
    let currentLevel = validLevels.includes(reasoningLevel) ? reasoningLevel : 'on'

    let response = await callLmStudio(currentLevel)

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      const isReasoningError = errText.includes('Reasoning setting') && errText.includes('not supported')
      if (isReasoningError && currentLevel !== 'on') {
        response = await callLmStudio('on')
      }
      if (!response.ok) {
        const finalErr = await response.text().catch(() => 'Unknown error')
        return res.status(502).json({ error: `LM Studio API error: ${finalErr}` })
      }
    }

    const reader = response.body?.getReader()
    if (!reader) {
      return res.status(502).json({ error: 'No response body from LM Studio' })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const decoder = new TextDecoder()
    let buf = ''
    let currentEvent = ''

    const flushableEvents = new Set([
      'reasoning.delta',
      'message.delta',
    ])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
          continue
        }
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (!data) continue
          try {
            const parsed = JSON.parse(data)

            if (currentEvent === 'chat.end' && parsed.result?.response_id) {
              responseIds[cid] = parsed.result.response_id
            }

            if (!flushableEvents.has(currentEvent)) continue

            const text = parsed.content
            if (!text) continue

            if (currentEvent === 'reasoning.delta') {
              messageStore.appendChunk(cid, '', text)
              res.write(`event: reasoning\ndata: ${JSON.stringify({ content: text })}\n\n`)
            } else {
              messageStore.appendChunk(cid, text, undefined)
              res.write(`event: content\ndata: ${JSON.stringify({ content: text })}\n\n`)
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    }

    res.write(`event: done\ndata: ${JSON.stringify({ conversationId: cid, messageId: assistantMessage.id })}\n\n`)
    res.end()
  } catch (error: any) {
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`)
      res.end()
    } else {
      res.status(500).json({ error: error.message })
    }
  }
})

export { router as chatRoutes }
