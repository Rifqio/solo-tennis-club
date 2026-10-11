import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom'
import { ClubPage } from './features/public/club/ClubPage'
import { PublicLayout } from './features/public/layout/PublicLayout'
import { SchedulePage } from './features/public/schedule/SchedulePage'
import { RouteErrorPage } from './features/errors/RouteErrorPage'

const router = createBrowserRouter([
  {
    path: '/admin',
    lazy: () => import('./features/admin/admin-routes'),
    errorElement: <RouteErrorPage audience="admin" />,
    children: [
      { path: 'sign-in', lazy: () => import('./features/admin/auth/sign-in-route') },
      { lazy: () => import('./features/admin/auth/require-admin-route'), children: [
        { lazy: () => import('./features/admin/shell/admin-layout-route'), children: [
          { index: true, lazy: () => import('./features/admin/sessions/admin-index-route') },
          { path: 'sessions', lazy: () => import('./features/admin/sessions/sessions-route') },
          { path: 'sessions/new', lazy: () => import('./features/admin/sessions/SessionEditorPage') },
          { path: 'sessions/:id/edit', lazy: () => import('./features/admin/sessions/SessionEditorPage') },
          { path: 'sessions/:id/roster', lazy: () => import('./features/admin/sessions/SessionRosterPage') },
          { path: 'sessions/:id/book', lazy: () => import('./features/admin/bookings/AdminBookingFormPage') },
          { lazy: () => import('./features/admin/bookings/bookings-route'), children: [
            { path: 'bookings', lazy: () => import('./features/admin/bookings/AdminBookingsPage') },
            { path: 'bookings/:id', lazy: () => import('./features/admin/bookings/AdminBookingDetailPage') },
          ] },
          { path: 'manage', lazy: () => import('./features/admin/manage/ManagePage') },
          { lazy: () => import('./features/admin/classes/classes-route'), children: [
            { path: 'classes', lazy: () => import('./features/admin/classes/ClassListPage') },
            { path: 'classes/new', lazy: () => import('./features/admin/classes/ClassFormPage') },
            { path: 'classes/:id/edit', lazy: () => import('./features/admin/classes/ClassFormPage') },
          ] },
          { lazy: () => import('./features/admin/references/references-route'), children: ['coaches', 'venues', 'levels'].flatMap(path => [
            { path, lazy: () => import('./features/admin/references/ReferenceListPage') },
            { path: `${path}/new`, lazy: () => import('./features/admin/references/ReferenceFormPage') },
            { path: `${path}/:id/edit`, lazy: () => import('./features/admin/references/ReferenceFormPage') },
          ]) },
          { path: '*', lazy: () => import('./features/admin/shell/not-found-route') },
        ] },
      ] },
    ],
  },
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: '/schedule', element: <SchedulePage /> },
      { path: '/club', element: <Navigate to="/" replace /> },
      { path: '/customer/sign-in', lazy: () => import('./features/customer/auth/CustomerAccessPage') },
      { path: '/book/:sessionId', lazy: () => import('./features/customer/booking/BookingPage') },
      { path: '/bookings', lazy: () => import('./features/customer/my-bookings/MyBookingsPage') },
      { path: '/bookings/:id', lazy: () => import('./features/customer/my-bookings/MyBookingDetailPage') },
      { path: '/bookings/:id/pay', lazy: () => import('./features/customer/payments/PayPage') },
    ],
  },
  // Any other address: the 404 page on its own, without the app's dock or rail.
  { path: '*', lazy: () => import('./features/errors/RouteErrorPage'), errorElement: <RouteErrorPage /> },
])

// The club page is the home page. Schedule links from before the move (/?date=…&session=…) land on /schedule unchanged.
function HomeRoute() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  if (params.has('date') || params.has('session')) return <Navigate to={`/schedule${search}`} replace />
  return <ClubPage />
}

export default function App() { return <RouterProvider router={router} /> }
