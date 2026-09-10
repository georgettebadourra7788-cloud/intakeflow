import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import IntakeDetail from './pages/IntakeDetail.jsx'
import IntakeForm from './pages/IntakeForm.jsx'
import IntakeThanks from './pages/IntakeThanks.jsx'
import Login from './pages/Login.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/intake" replace />} />
      <Route path="/intake" element={<IntakeForm />} />
      <Route path="/intake/thanks" element={<IntakeThanks />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/intake/:id"
        element={
          <ProtectedRoute>
            <IntakeDetail />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
