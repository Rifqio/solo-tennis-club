import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { SchedulePage } from './features/public/schedule/SchedulePage'
const router = createBrowserRouter([{ path: '/', element: <SchedulePage /> }])
export default function App() { return <RouterProvider router={router} /> }
