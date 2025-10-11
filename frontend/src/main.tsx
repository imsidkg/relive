import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from './trpc'

// Create clients
const queryClient = new QueryClient()
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      // FIXME: Ensure this URL points to your backend's tRPC endpoint
      url: 'http://localhost:4000/trpc',
    }),
  ],
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
)
