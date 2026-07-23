import { Router } from 'express'
import * as store from './store'

const router = Router()

router.get('/', (_req, res) => {
  res.json(store.listConversations())
})

router.post('/', (req, res) => {
  const { title } = req.body
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' })
  }
  const conversation = store.createConversation(title)
  res.status(201).json(conversation)
})

router.get('/:id', (req, res) => {
  const conversation = store.getConversation(req.params.id)
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' })
  }
  res.json(conversation)
})

router.patch('/:id', (req, res) => {
  const { title } = req.body
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' })
  }
  const conversation = store.updateConversation(req.params.id, { title })
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' })
  }
  res.json(conversation)
})

router.delete('/:id', (req, res) => {
  const deleted = store.deleteConversation(req.params.id)
  if (!deleted) {
    return res.status(404).json({ error: 'Conversation not found' })
  }
  res.status(204).end()
})

export { router as conversationRoutes }
