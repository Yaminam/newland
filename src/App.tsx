import { RouterProvider } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { router } from './app/routes/routes'

// Landing-only build: no auth, no Supabase, no dashboard. Just the marketing
// homepage. This keeps the deploy a pure static site with zero env-var deps.
export function App() {
  return (
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  )
}
