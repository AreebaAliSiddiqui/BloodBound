import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import Layout from './Layout'
import { Login, Register } from './pages/Auth'
import Home from './pages/Home'
import Landing from './pages/Landing'
import { Alerts, Camps, Profile } from './pages/donor'
import { MyRequests, NewRequest, RequestDetail } from './pages/hospital'
import { NewCamp, Roster } from './pages/organizer'
import { AdminRequests, AdminUsers } from './pages/admin'

// Logged-out visitors see the public landing page; logged-in users get their role's workspace.
function Root() {
  const { user } = useAuth()
  return user ? <Layout /> : <Landing />
}

function Guard({ roles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

const only = (roles, el) => <Guard roles={roles}>{el}</Guard>

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Root />}>
            <Route index element={<Home />} />
            <Route path="alerts" element={only(['donor'], <Alerts />)} />
            <Route path="camps" element={only(['donor'], <Camps />)} />
            <Route path="profile" element={only(['donor'], <Profile />)} />
            <Route path="requests" element={only(['hospital_staff'], <MyRequests />)} />
            <Route path="requests/new" element={only(['hospital_staff'], <NewRequest />)} />
            <Route path="requests/:id" element={only(['hospital_staff'], <RequestDetail />)} />
            <Route path="organizer/new" element={only(['camp_organizer'], <NewCamp />)} />
            <Route path="organizer/:id" element={only(['camp_organizer'], <Roster />)} />
            <Route path="admin/users" element={only(['admin'], <AdminUsers />)} />
            <Route path="admin/requests" element={only(['admin'], <AdminRequests />)} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
