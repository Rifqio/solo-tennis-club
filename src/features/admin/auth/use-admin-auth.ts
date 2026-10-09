import { use } from 'react'
import { AdminAuthContext } from './admin-auth-context'

export function useAdminAuth() {
  const auth = use(AdminAuthContext)
  if (!auth) throw new Error('Admin auth provider required')
  return auth
}
