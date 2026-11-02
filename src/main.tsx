import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { keepAppUpdated } from './core/sw'
import './styles/main.scss'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root')

keepAppUpdated()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
