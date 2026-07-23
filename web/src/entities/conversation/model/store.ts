import { create } from 'zustand'
import type { Conversation } from './types'

interface ConversationState {
  conversations: Conversation[]
  activeConversationId: string | null
  setConversations: (conversations: Conversation[]) => void
  setActiveConversation: (id: string) => void
  addConversation: (conversation: Conversation) => void
  renameConversation: (id: string, title: string) => void
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversations: [],
  activeConversationId: null,

  setConversations: (conversations) =>
    set({ conversations }),

  setActiveConversation: (id) =>
    set({ activeConversationId: id }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [...state.conversations, conversation],
      activeConversationId: conversation.id,
    })),

  renameConversation: (id, title) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c,
      ),
    })),
}))
