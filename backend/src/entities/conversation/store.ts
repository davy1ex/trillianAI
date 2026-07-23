import type { Conversation } from './types'

function timestamp(): string {
  return new Date().toISOString()
}

  const conversations: Conversation[] = [
    {
      id: 'default',
      title: 'Новый чат',
      systemPrompt: null,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    },
  ]

export function listConversations(): Conversation[] {
  return [...conversations]
}

export function getConversation(id: string): Conversation | undefined {
  return conversations.find(c => c.id === id)
}

export function createConversation(title: string): Conversation {
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    title,
    systemPrompt: null,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  }
  conversations.push(conversation)
  return conversation
}

export function updateConversation(id: string, data: Partial<Pick<Conversation, 'title'>>): Conversation | null {
  const idx = conversations.findIndex(c => c.id === id)
  if (idx === -1) return null
  conversations[idx] = {
    ...conversations[idx],
    ...data,
    updatedAt: timestamp(),
  }
  return conversations[idx]
}

export function updateConversationSystemPrompt(id: string, systemPrompt: string | null): void {
  const idx = conversations.findIndex(c => c.id === id)
  if (idx === -1) return
  conversations[idx].systemPrompt = systemPrompt
  conversations[idx].updatedAt = timestamp()
}

export function deleteConversation(id: string): boolean {
  const idx = conversations.findIndex(c => c.id === id)
  if (idx === -1) return false
  conversations.splice(idx, 1)
  return true
}
