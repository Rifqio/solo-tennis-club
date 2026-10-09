import { Outlet } from 'react-router-dom'
import { AdminAuthProvider } from './auth/AdminAuthProvider'

export function Component() {
  return <AdminAuthProvider><Outlet /></AdminAuthProvider>
}
