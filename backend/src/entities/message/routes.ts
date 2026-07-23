import { Router } from 'express'
import * as store from './store'
import { getConversation } from '../conversation/store'
import type { MessageRole } from './types'

const router = Router()

router.get('/:conversationId/messages', (req, res) => {
  const { conversationId } = req.params
  if (!getConversation(conversationId)) {
    return res.status(404).json({ error: 'Conversation not found' })
  }
  res.json(store.getMessages(conversationId))
})

router.post('/:conversationId/messages', (req, res) => {
  const { conversationId } = req.params
  const { role, content, reasoning } = req.body

  if (!getConversation(conversationId)) {
    return res.status(404).json({ error: 'Conversation not found' })
  }
  if (!role || !['user', 'assistant'].includes(role)) {
    return res.status(400).json({ error: 'role must be "user" or "assistant"' })
  }
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'content is required' })
  }

  const message = store.addMessage(
    conversationId,
    role as MessageRole,
    content,
    reasoning,
  )
  res.status(201).json(message)
})

router.delete('/messages/:messageId', (req, res) => {
  const { messageId } = req.params
  const conversationId = req.query.conversationId as string
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId query param is required' })
  }
  const deleted = store.deleteMessage(conversationId, messageId)
  if (!deleted) {
    return res.status(404).json({ error: 'Message not found' })
  }
  res.status(204).end()
})

export { router as messageRoutes }
