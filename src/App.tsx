import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ClubPage } from './features/public/club/ClubPage'
import { PublicLayout } from './features/public/layout/PublicLayout'
import { SchedulePage } from './features/public/schedule/SchedulePage'

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <SchedulePage /> },
      { path: '/club', element: <ClubPage /> },
    ],
  },
])

export default function App() { return <RouterProvider router={router} /> }
