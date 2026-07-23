import type { Conversation } from '../../entities/conversation'

const BASE = '/api/conversations'

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error('Failed to fetch conversations')
  return res.json()
}

export async function createConversation(title: string): Promise<Conversation> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('Failed to create conversation')
  return res.json()
}

export async function updateConversationTitle(id: string, title: string): Promise<Conversation> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('Failed to update conversation')
  return res.json()
}
