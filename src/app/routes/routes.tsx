import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RedesignLanding } from '../pages/marketing/redesign/RedesignLanding'

// Landing-only router. The redesigned homepage is the entire public site;
// every other path bounces back to it. No auth, dashboard, or admin routes.
export const router = createBrowserRouter([
  { path: '/', element: <RedesignLanding /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
