import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainPage from './pages/auth_screens/MainPage'
import Login from './pages/auth_screens/Login'
import Signup from './pages/auth_screens/Signup'
import UserDashboard from './pages/user_screens/UserDashboard'
import JoinQueue from './pages/user_screens/JoinQueue'
import QueueStatus from './pages/user_screens/QueueStatus'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/join" element={<JoinQueue />} />
        <Route path="/queue-status" element={<QueueStatus />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App