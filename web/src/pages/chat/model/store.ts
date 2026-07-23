import { create } from 'zustand'

interface ChatPageState {
  loading: boolean
  setLoading: (v: boolean) => void
}

export const useChatPageStore = create<ChatPageState>((set) => ({
  loading: true,
  setLoading: (loading) => set({ loading }),
}))
