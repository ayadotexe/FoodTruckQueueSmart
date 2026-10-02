import { BrowserRouter, Routes, Route } from 'react-router-dom'
// auth
import MainPage from './pages/auth_screens/MainPage'
import Login from './pages/auth_screens/Login'
import Signup from './pages/auth_screens/Signup'
// user
import UserDashboard from "./pages/user_screens/UserDashboard";
import JoinQueue from "./pages/user_screens/JoinQueue";
import QueueStatus from './pages/user_screens/QueueStatus'
import QueueHistory from "./pages/user_screens/queueHistory"
//admin
import AdminDashboard from './pages/admin_screens/adminDashboard'
import ViewHistory from './pages/admin_screens/paths/viewHistory'
import ViewMenu from './pages/admin_screens/paths/viewMenu'
import ViewQueue from './pages/admin_screens/paths/viewQueue'
import ViewOrder from './pages/admin_screens/paths/viewOrder'
// import ViewStats from './pages/admin_screens/paths/viewStats'



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/user-dash" element={<UserDashboard />} />
        <Route path="/join-queue" element={<JoinQueue />} />
        <Route path="/queue-status" element={<QueueStatus />} />
        <Route path="/queue-history" element={<QueueHistory />} />

        <Route path="/admin-dash" element={<AdminDashboard />} />
        <Route path="/admin-history" element={<ViewHistory />} />
        <Route path="/admin-menu" element={<ViewMenu />} />
        <Route path="/admin-queue" element={<ViewQueue />} />
        <Route path="/admin-order" element={<ViewOrder />} />
        {/* <Route path="/admin-stats" element={<ViewStats />} /> */}

      </Routes>
    </BrowserRouter>
  )
}

export default App