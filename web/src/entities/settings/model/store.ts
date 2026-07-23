import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  baseUrl: string
  modelName: string
  enableReasoning: boolean
  systemPrompt: string
  setBaseUrl: (url: string) => void
  setModelName: (name: string) => void
  setEnableReasoning: (enabled: boolean) => void
  setSystemPrompt: (prompt: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      baseUrl: 'http://localhost:1234',
      modelName: 'qwen/qwen3-4b-2507',
      enableReasoning: true,
      systemPrompt: 'You are a helpful assistant.',

      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setModelName: (modelName) => set({ modelName }),
      setEnableReasoning: (enableReasoning) => set({ enableReasoning }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
    }),
    { name: 'simpleagent-settings' },
  ),
)
