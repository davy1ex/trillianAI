import type { Message } from '../../entities/message'

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const res = await fetch(`/api/${conversationId}/messages`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}
