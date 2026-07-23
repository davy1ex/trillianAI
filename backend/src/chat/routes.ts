import { Router } from 'express'
import { LMStudioClient } from '@lmstudio/sdk'
import * as conversationStore from '../entities/conversation/store'
import * as messageStore from '../entities/message/store'

const router = Router()
const client = new LMStudioClient()

const MODEL_KEY = process.env.MODEL_KEY || 'qwen/qwen3-4b-2507'

let model: Awaited<ReturnType<typeof client.llm.model>> | null = null
let modelLoading: Promise<void> | null = null

async function ensureModel() {
  if (model) return
  if (modelLoading) return modelLoading
  modelLoading = (async () => {
    console.info(`Loading model: ${MODEL_KEY}...`)
    model = await client.llm.model(MODEL_KEY)
    console.info('Model loaded')
  })()
  return modelLoading
}

router.post('/', async (req, res) => {
  const { prompt, conversationId, enableReasoning = true } = req.body

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' })
  }

  try {
    await ensureModel()

    if (conversationId && !conversationStore.getConversation(conversationId)) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    const cid = conversationId ?? conversationStore.createConversation('New chat').id

    messageStore.addMessage(cid, 'user', prompt)
    const assistantMessage = messageStore.addMessage(cid, 'assistant', '')

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const prediction = model!.respond(
      [{ role: 'user', content: prompt }],
      {
        reasoningParsing: {
          enabled: enableReasoning,
          startString: '<think>',
          endString: '</think>',
        },
      },
    )

    for await (const fragment of prediction) {
      const isReasoning = enableReasoning && fragment.reasoningType === 'reasoning'
      messageStore.appendChunk(
        cid,
        isReasoning ? '' : fragment.content,
        isReasoning ? fragment.content : undefined,
      )
      if (isReasoning) {
        res.write(`event: reasoning\ndata: ${JSON.stringify({ content: fragment.content })}\n\n`)
      } else {
        res.write(`event: content\ndata: ${JSON.stringify({ content: fragment.content })}\n\n`)
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
