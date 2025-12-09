import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CashierInterface from './CashierInterface.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CashierInterface />
  </StrictMode>,
)
