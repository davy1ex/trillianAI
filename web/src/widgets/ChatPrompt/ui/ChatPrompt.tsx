import { useRef, useEffect } from 'react'
import styles from './ChatPrompt.module.css'

interface ChatPromptProps {
  input: string
  onInputChange: (value: string) => void
  isStreaming: boolean
  onSend: () => void
  onStop: () => void
}

export const ChatPrompt = ({ input, onInputChange, isStreaming, onSend, onStop }: ChatPromptProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isStreaming])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className={styles.inputArea}>
      <textarea
        ref={textareaRef}
        className={styles.input}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Input prompt..."
        rows={1}
      />
      <button
        className={styles.sendButton}
        onClick={isStreaming ? onStop : onSend}
        disabled={!isStreaming && !input.trim()}
        type="button"
      >
        {isStreaming ? '■' : '→'}
      </button>
    </div>
  )
}
