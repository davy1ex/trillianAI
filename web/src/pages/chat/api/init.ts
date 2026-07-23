import { fetchConversations } from '../../../shared/api/conversations'
import { useConversationStore } from '../../../entities/conversation'
import { useChatPageStore } from '../model/store'

export async function initializePage(): Promise<void> {
  try {
    const convos = await fetchConversations()
    useConversationStore.getState().setConversations(convos)
    if (convos.length > 0) {
      useConversationStore.getState().setActiveConversation(convos[0].id)
    }
  } catch {
    useChatPageStore.getState().setLoading(false)
  }
}
