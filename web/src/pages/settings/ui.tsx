import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../../entities/settings'
import styles from './ui.module.css'

const sections = ['Model', 'System'] as const

export const SettingsPage = () => {
  const navigate = useNavigate()
  const baseUrl = useSettingsStore((s) => s.baseUrl)
  const modelName = useSettingsStore((s) => s.modelName)
  const enableReasoning = useSettingsStore((s) => s.enableReasoning)
  const systemPrompt = useSettingsStore((s) => s.systemPrompt)
  const setBaseUrl = useSettingsStore((s) => s.setBaseUrl)
  const setModelName = useSettingsStore((s) => s.setModelName)
  const setEnableReasoning = useSettingsStore((s) => s.setEnableReasoning)
  const setSystemPrompt = useSettingsStore((s) => s.setSystemPrompt)

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.logo} onClick={() => navigate('/')}>Trillian</div>
        <nav className={styles.nav}>
          {sections.map((section) => (
            <a key={section} href={`#${section.toLowerCase()}`} className={styles.navItem}>
              {section}
            </a>
          ))}
        </nav>
      </aside>
      <main className={styles.content}>
        <button className={styles.backButton} onClick={() => navigate('/')} type="button">
          ← Back to Chat
        </button>
        <section id="model" className={styles.section}>
          <h2 className={styles.sectionTitle}>Model</h2>
          <div className={styles.field}>
            <label className={styles.label}>Base URL</label>
            <input
              className={styles.input}
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:1234"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Model name</label>
            <input
              className={styles.input}
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="qwen/qwen3-4b-2507"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Reasoning</label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={enableReasoning}
                onChange={(e) => setEnableReasoning(e.target.checked)}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        </section>

        <section id="system" className={styles.section}>
          <h2 className={styles.sectionTitle}>System</h2>
          <div className={styles.field}>
            <label className={styles.label}>System prompt</label>
            <textarea
              className={styles.textarea}
              rows={6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant."
            />
          </div>
        </section>

      </main>
    </div>
  )
}
