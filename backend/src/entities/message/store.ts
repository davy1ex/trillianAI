import type { Message, MessageRole } from './types'

function createId(): string {
  return crypto.randomUUID()
}

function timestamp(): string {
  return new Date().toISOString()
}

const messagesByConversation: Record<string, Message[]> = {
  'default': [
  ],
}

export function getMessages(conversationId: string): Message[] {
  return [...(messagesByConversation[conversationId] ?? [])]
}

export function addMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  reasoning?: string,
): Message {
  const message: Message = {
    id: createId(),
    conversationId,
    role,
    content,
    reasoning: reasoning ?? null,
    createdAt: timestamp(),
  }
  if (!messagesByConversation[conversationId]) {
    messagesByConversation[conversationId] = []
  }
  messagesByConversation[conversationId].push(message)
  return message
}

export function appendChunk(
  conversationId: string,
  content: string,
  reasoning?: string,
): void {
  const messages = messagesByConversation[conversationId]
  if (!messages || messages.length === 0) return

  const last = messages[messages.length - 1]
  if (last.role !== 'assistant') return

  last.content += content
  if (reasoning !== undefined) {
    last.reasoning = (last.reasoning ?? '') + reasoning
  }
}

export function deleteMessage(conversationId: string, messageId: string): boolean {
  const messages = messagesByConversation[conversationId]
  if (!messages) return false
  const idx = messages.findIndex(m => m.id === messageId)
  if (idx === -1) return false
  messages.splice(idx, 1)
  return true
}
