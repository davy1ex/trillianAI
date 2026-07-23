import { Routes, Route, Navigate } from 'react-router-dom'
import { ChatPage } from '../pages/chat'
import { SettingsPage } from '../pages/settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
