import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { TooltipProvider } from './components/ui.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TooltipProvider><App /></TooltipProvider>
  </React.StrictMode>
)
