import { Routes, Route, Navigate } from 'react-router-dom'
import { ChatPage } from '../pages/chat'

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
