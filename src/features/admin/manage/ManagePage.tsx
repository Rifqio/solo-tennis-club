import { Navigate } from 'react-router-dom'

// Kelola opens on its first tab; the band on each list switches between coaches, venues and levels.
export function ManagePage() { return <Navigate to="/admin/coaches" replace /> }
export const Component = ManagePage
