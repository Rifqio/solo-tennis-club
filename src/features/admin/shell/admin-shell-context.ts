import { createContext, useContext } from 'react'

// Sign-out lives in the layout (it owns the pending and failure state); the band on each screen triggers it.
export interface AdminShell { signOut: () => void; signingOut: boolean }

export const AdminShellContext = createContext<AdminShell>({ signOut: () => {}, signingOut: false })

export function useAdminShell() { return useContext(AdminShellContext) }
