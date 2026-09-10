import { Navigate, Route, Routes } from 'react-router-dom'
import IntakeForm from './pages/IntakeForm.jsx'
import IntakeThanks from './pages/IntakeThanks.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/intake" replace />} />
      <Route path="/intake" element={<IntakeForm />} />
      <Route path="/intake/thanks" element={<IntakeThanks />} />
    </Routes>
  )
}

export default App
