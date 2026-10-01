import { BrowserRouter, Routes, Route } from 'react-router-dom'
// auth
import MainPage from './pages/auth_screens/MainPage'
import Login from './pages/auth_screens/Login'
import Signup from './pages/auth_screens/Signup'
// user
import UserDashboard from "./pages/user_screens/UserDashboard";
import JoinQueue from "./pages/user_screens/JoinQueue";
//admin
import AdminDashboard from './pages/admin_screens/adminDashboard'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/user-dash" element={<UserDashboard />} />
        <Route path="/join-queue" element={<JoinQueue />} />

        <Route path="/admin-dash" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App