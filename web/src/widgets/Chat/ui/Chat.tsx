import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useMessageStore } from '../../../entities/message'
import { useConversationStore } from '../../../entities/conversation'
import { useSettingsStore } from '../../../entities/settings'
import { sendChatMessageSSE } from '../../../shared/api/chat'
import { createConversation, updateConversationTitle } from '../../../shared/api/conversations'
import { fetchMessages } from '../../../shared/api/messages'
import { ChatPrompt } from '../../../widgets/ChatPrompt'
import type { Message } from '../../../entities/message'
import styles from './Chat.module.css'

function slugFromPrompt(prompt: string): string {
  const cleaned = prompt.replace(/\s+/g, ' ').trim()
  const maxLen = 42
  if (cleaned.length <= maxLen) return cleaned
  return cleaned.slice(0, maxLen).trimEnd() + '…'
}

function MessageBubble({ message }: { message: Message }) {
  const [showReasoning, setShowReasoning] = useState(true)

  return (
    <div className={`${styles.message} ${message.role === 'user' ? styles.user : styles.assistant}`}>
      {message.reasoning && (
        <div className={styles.reasoning}>
          <button
            className={styles.reasoningToggle}
            onClick={() => setShowReasoning((v) => !v)}
            type="button"
          >
            {showReasoning ? '▼' : '▶'} Reasoning
          </button>
          {showReasoning && (
            <div className={styles.reasoningContent}>{message.reasoning}</div>
          )}
        </div>
      )}
      <div className={styles.bubble}>
        <div className={styles.content}>{message.content}</div>
      </div>
    </div>
  )
}

export const Chat = () => {
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<(() => void) | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const conversations = useConversationStore((s) => s.conversations)
  const activeConversationId = useConversationStore((s) => s.activeConversationId)
  const setConversations = useConversationStore((s) => s.setConversations)
  const setActiveConversation = useConversationStore((s) => s.setActiveConversation)
  const renameConversation = useConversationStore((s) => s.renameConversation)

  const messagesByConversation = useMessageStore((s) => s.messagesByConversation)
  const setMessages = useMessageStore((s) => s.setMessages)
  const addMessage = useMessageStore((s) => s.addMessage)
  const appendChunk = useMessageStore((s) => s.appendChunk)
  const enableReasoning = useSettingsStore((s) => s.enableReasoning)
  const systemPrompt = useSettingsStore((s) => s.systemPrompt)
  const baseUrl = useSettingsStore((s) => s.baseUrl)
  const modelName = useSettingsStore((s) => s.modelName)

  const messages = useMemo(
    () => (activeConversationId ? (messagesByConversation[activeConversationId] ?? []) : []),
    [messagesByConversation, activeConversationId],
  )

  useEffect(() => {
    if (!activeConversationId) return
    fetchMessages(activeConversationId).then((msgs) => {
      setMessages(activeConversationId, msgs)
    })
  }, [activeConversationId, setMessages])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const stopStreaming = useCallback(() => {
    abortRef.current?.()
    abortRef.current = null
    setIsStreaming(false)
  }, [])

  useEffect(() => {
    return () => stopStreaming()
  }, [stopStreaming])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')

    const send = (cid: string) => {
      addMessage(cid, 'user', text)
      addMessage(cid, 'assistant', '')
      setIsStreaming(true)

      const conv = conversations.find((c) => c.id === cid)
      if (conv && conv.title === 'Новый чат') {
        const title = slugFromPrompt(text)
        updateConversationTitle(cid, title)
        renameConversation(cid, title)
      }

      abortRef.current = sendChatMessageSSE(
        text,
        cid,
        {
          onContent: (content) => appendChunk(cid, content),
          onReasoning: (reasoning) => appendChunk(cid, '', reasoning),
          onDone: () => setIsStreaming(false),
          onError: () => setIsStreaming(false),
        },
        enableReasoning,
        baseUrl,
        modelName,
        systemPrompt,
      )
    }

    if (activeConversationId) {
      send(activeConversationId)
    } else {
      createConversation('Новый чат').then((conv) => {
        setConversations([...conversations, conv])
        setActiveConversation(conv.id)
        send(conv.id)
      })
    }
  }, [input, activeConversationId, isStreaming, conversations, addMessage, appendChunk, setConversations, setActiveConversation, renameConversation, enableReasoning, systemPrompt, baseUrl, modelName])

  return (
    <div className={styles.container}>
      {messages.length === 0 ? (
        <div className={styles.emptyState}>Новый чат. Напишите что-нибудь...</div>
      ) : (
        <div ref={listRef} className={styles.messageList}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
      )}
      <ChatPrompt
        input={input}
        onInputChange={setInput}
        isStreaming={isStreaming}
        onSend={handleSend}
        onStop={stopStreaming}
      />
    </div>
  )
}
