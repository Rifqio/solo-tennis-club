import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ClubPage } from './features/public/club/ClubPage'
import { PublicLayout } from './features/public/layout/PublicLayout'
import { SchedulePage } from './features/public/schedule/SchedulePage'
import type { ReferenceKind } from '@shared/api/admin-references'

const router = createBrowserRouter([
  {
    path: '/admin',
    lazy: () => import('./features/admin/admin-routes'),
    children: [
      { path: 'sign-in', lazy: () => import('./features/admin/auth/sign-in-route') },
      { lazy: () => import('./features/admin/auth/require-admin-route'), children: [
        { lazy: () => import('./features/admin/shell/admin-layout-route'), children: [
          { index: true, lazy: () => import('./features/admin/sessions/admin-index-route') },
          { path: 'sessions', lazy: () => import('./features/admin/sessions/sessions-route') },
          { path: 'sessions/new', lazy: () => import('./features/admin/sessions/SessionEditorPage') },
          { path: 'sessions/:id/edit', lazy: () => import('./features/admin/sessions/SessionEditorPage') },
          { path: 'sessions/:id/roster', lazy: () => import('./features/admin/sessions/SessionRosterPage') },
          { path: 'bookings', lazy: () => import('./features/admin/bookings/AdminBookingsPage') },
          { path: 'bookings/:id', lazy: () => import('./features/admin/bookings/AdminBookingDetailPage') },
          { path: 'manage', lazy: () => import('./features/admin/manage/ManagePage') },
          { path: 'classes', lazy: () => import('./features/admin/classes/ClassListPage') },
          { path: 'classes/new', lazy: () => import('./features/admin/classes/ClassFormPage') },
          { path: 'classes/:id/edit', lazy: () => import('./features/admin/classes/ClassFormPage') },
          ...([['coaches', 'coach'], ['venues', 'venue'], ['levels', 'level']] as const).flatMap(([path, kind]) => [
            { path, lazy: async () => { const { ReferenceListPage } = await import('./features/admin/references/ReferenceListPage'); return { Component: () => <ReferenceListPage kind={kind as ReferenceKind} /> } } },
            ...['new', ':id/edit'].map(suffix => ({ path: `${path}/${suffix}`, lazy: async () => { const { ReferenceFormPage } = await import('./features/admin/references/ReferenceFormPage'); return { Component: () => <ReferenceFormPage kind={kind as ReferenceKind} /> } } })),
          ]),
          { path: '*', lazy: () => import('./features/admin/shell/not-found-route') },
        ] },
      ] },
    ],
  },
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <SchedulePage /> },
      { path: '/club', element: <ClubPage /> },
      { path: '/customer/sign-in', lazy: () => import('./features/customer/auth/CustomerAccessPage') },
      { path: '/book/:sessionId', lazy: () => import('./features/customer/booking/BookingPage') },
      { path: '/bookings', lazy: () => import('./features/customer/my-bookings/MyBookingsPage') },
      { path: '/bookings/:id', lazy: () => import('./features/customer/my-bookings/MyBookingDetailPage') },
    ],
  },
])

export default function App() { return <RouterProvider router={router} /> }
