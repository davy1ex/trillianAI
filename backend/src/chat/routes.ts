import { Router } from 'express'
import { LMStudioClient } from '@lmstudio/sdk'
import type { LMStudioClientConstructorOpts } from '@lmstudio/sdk'
import * as conversationStore from '../entities/conversation/store'
import * as messageStore from '../entities/message/store'

const router = Router()

let currentClient: LMStudioClient | null = null
let currentModelKey: string | null = null
let model: Awaited<ReturnType<LMStudioClient['llm']['model']>> | null = null
let modelLoading: Promise<void> | null = null

function toWsUrl(httpUrl?: string): string | undefined {
  if (!httpUrl) return undefined
  return httpUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
}

function getClient(baseUrl?: string): LMStudioClient {
  const wsUrl = toWsUrl(baseUrl)
  if (wsUrl) {
    return new LMStudioClient({ baseUrl: wsUrl } satisfies LMStudioClientConstructorOpts)
  }
  if (!currentClient) {
    currentClient = new LMStudioClient()
  }
  return currentClient
}

async function ensureModel(client: LMStudioClient, modelKey: string) {
  if (model && currentModelKey === modelKey) return
  if (modelLoading) return modelLoading
  modelLoading = (async () => {
    console.info(`Loading model: ${modelKey}...`)
    model = await client.llm.model(modelKey)
    currentModelKey = modelKey
    console.info('Model loaded')
  })()
  return modelLoading
}

router.post('/', async (req, res) => {
  const { prompt, conversationId, enableReasoning = true, baseUrl, modelName, systemPrompt } = req.body

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' })
  }

  try {
    const modelKey = modelName || process.env.MODEL_KEY || 'qwen/qwen3-4b-2507'
    const client = getClient(baseUrl)

    await ensureModel(client, modelKey)

    if (conversationId && !conversationStore.getConversation(conversationId)) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    const cid = conversationId ?? conversationStore.createConversation('New chat').id

    messageStore.addMessage(cid, 'user', prompt)
    const assistantMessage = messageStore.addMessage(cid, 'assistant', '')

    const conv = conversationStore.getConversation(cid)
    const prevSystemPrompt = conv?.systemPrompt ?? null
    const newSystemPrompt = systemPrompt && typeof systemPrompt === 'string' ? systemPrompt : null
    if (conv) {
      conversationStore.updateConversationSystemPrompt(cid, newSystemPrompt)
    }

    const history = messageStore.getMessages(cid)
    // exclude the empty assistant message that was just created
    const historyMsgs = history.slice(0, -1)
    const systemPromptChanged = newSystemPrompt !== prevSystemPrompt

    const thinkInstruction = 'Think step by step before answering. Start your reasoning with [REASONING] and end it with [/REASONING], then give your final answer.'

    const llmMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []
    if (newSystemPrompt) {
      llmMessages.push({
        role: 'system',
        content: enableReasoning ? `${newSystemPrompt}\n\n${thinkInstruction}` : newSystemPrompt,
      })
    } else if (enableReasoning) {
      llmMessages.push({ role: 'system', content: thinkInstruction })
    }
    for (const msg of historyMsgs) {
      if (systemPromptChanged && msg.role === 'assistant') continue
      llmMessages.push({ role: msg.role, content: msg.content })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const prediction = model!.respond(
      llmMessages,
      {
        reasoningParsing: {
          enabled: enableReasoning,
          startString: '[REASONING]',
          endString: '[/REASONING]',
        },
      },
    )

    for await (const fragment of prediction) {
      const type = fragment.reasoningType
      // skip marker fragments ([REASONING] / [/REASONING])
      if (type === 'reasoningStartTag' || type === 'reasoningEndTag') continue

      const isReasoning = enableReasoning && type === 'reasoning'
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
