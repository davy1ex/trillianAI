import { create } from 'zustand'
import type { Message, MessageRole } from './types'

function createId(): string {
  return crypto.randomUUID()
}

function timestamp(): string {
  return new Date().toISOString()
}

interface MessageState {
  messagesByConversation: Record<string, Message[]>
  setMessages: (conversationId: string, messages: Message[]) => void
  addMessage: (conversationId: string, role: MessageRole, content: string, reasoning?: string) => Message
  appendChunk: (conversationId: string, content: string, reasoning?: string) => void
}

export const useMessageStore = create<MessageState>((set) => ({
  messagesByConversation: {},

  setMessages: (conversationId, messages) => {
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: messages,
      },
    }))
  },

  addMessage: (conversationId, role, content, reasoning) => {
    const message: Message = {
      id: createId(),
      role,
      content,
      reasoning: reasoning ?? null,
      createdAt: timestamp(),
    }
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [
          ...(state.messagesByConversation[conversationId] ?? []),
          message,
        ],
      },
    }))
    return message
  },

  appendChunk: (conversationId, content, reasoning) => {
    set((state) => {
      const messages = state.messagesByConversation[conversationId]
      if (!messages || messages.length === 0) return state

      const last = messages[messages.length - 1]
      if (last.role !== 'assistant') return state

      const updated = [...messages]
      updated[updated.length - 1] = {
        ...last,
        content: last.content + content,
        reasoning:
          reasoning !== undefined
            ? (last.reasoning ?? '') + reasoning
            : last.reasoning,
      }

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: updated,
        },
      }
    })
  },
}))
