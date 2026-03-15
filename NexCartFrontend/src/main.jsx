import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/index.css";
import App from './App.jsx'
import { getStoredTheme } from './components/layout/ThemeToggle'

// Apply saved theme before first paint to avoid flash
(function initTheme() {
  const theme = getStoredTheme();
  document.documentElement.setAttribute('data-theme', theme);
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
