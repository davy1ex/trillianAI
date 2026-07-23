import { useEffect } from 'react'
import { Chat } from '../../widgets/Chat'
import { Sidebar } from '../../widgets/Sidebar'
import { useChatPageStore } from './model/store'
import { initializePage } from './api/init'
import styles from './ui.module.css'

export const ChatPage = () => {
  const loading = useChatPageStore((s) => s.loading)
  const setLoading = useChatPageStore((s) => s.setLoading)

  useEffect(() => {
    initializePage().finally(() => setLoading(false))
  }, [setLoading])

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <Chat />
      </div>
    </div>
  )
}
