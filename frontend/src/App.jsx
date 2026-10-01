import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainPage from './pages/auth_screens/MainPage'
import Login from './pages/auth_screens/Login'
import Signup from './pages/auth_screens/Signup'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App