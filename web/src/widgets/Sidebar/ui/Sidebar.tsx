import { useState, useRef } from 'react'
import { useConversationStore } from '../../../entities/conversation'
import { createConversation, updateConversationTitle } from '../../../shared/api/conversations'
import type { Conversation } from '../../../entities/conversation'
import styles from './Sidebar.module.css'

export const Sidebar = () => {
  const conversations = useConversationStore((s) => s.conversations)
  const activeConversationId = useConversationStore((s) => s.activeConversationId)
  const setActiveConversation = useConversationStore((s) => s.setActiveConversation)
  const addConversation = useConversationStore((s) => s.addConversation)
  const renameConversation = useConversationStore((s) => s.renameConversation)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleNew = async () => {
    const conv = await createConversation('Новый чат')
    addConversation(conv)
  }

  const startEdit = (conv: Conversation) => {
    setEditingId(conv.id)
    setEditValue(conv.title)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const saveEdit = async () => {
    const id = editingId
    const title = editValue.trim()
    setEditingId(null)

    if (!id || !title) return

    await updateConversationTitle(id, title)
    renameConversation(id, title)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>SimpleAgent</div>

      <button className={styles.newButton} onClick={handleNew} type="button">
        + New Chat
      </button>

      <div className={styles.list}>
        {conversations.map((conv) => (
          <div key={conv.id} className={styles.itemWrapper}>
            {editingId === conv.id ? (
              <input
                ref={inputRef}
                className={styles.editInput}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit()
                  if (e.key === 'Escape') cancelEdit()
                }}
              />
            ) : (
              <button
                className={`${styles.item} ${conv.id === activeConversationId ? styles.itemActive : ''}`}
                onClick={() => setActiveConversation(conv.id)}
                onDoubleClick={() => startEdit(conv)}
                type="button"
              >
                {conv.title}
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
