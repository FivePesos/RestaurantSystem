import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CookInterface from './CookInterface'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CookInterface />
  </StrictMode>,
)
