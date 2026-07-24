import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ReasoningLevel = 'off' | 'low' | 'medium' | 'high' | 'on'

interface SettingsState {
  baseUrl: string
  modelName: string
  reasoningLevel: ReasoningLevel
  systemPrompt: string
  setBaseUrl: (url: string) => void
  setModelName: (name: string) => void
  setReasoningLevel: (level: ReasoningLevel) => void
  setSystemPrompt: (prompt: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      baseUrl: 'http://localhost:1234',
      modelName: 'qwen/qwen3-4b-2507',
      reasoningLevel: 'on',
      systemPrompt: 'You are a helpful assistant.',

      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setModelName: (modelName) => set({ modelName }),
      setReasoningLevel: (reasoningLevel) => set({ reasoningLevel }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
    }),
    { name: 'simpleagent-settings' },
  ),
)
