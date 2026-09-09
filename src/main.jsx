import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppVersionGate from './AppVersionGate.jsx'

const isIntro = window.location.pathname === '/intro'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isIntro ? <AppVersionGate /> : <App />}
  </StrictMode>,
)
