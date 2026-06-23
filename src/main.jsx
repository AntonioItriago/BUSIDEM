import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Admin from './Admin.jsx' // Importamos el módulo administrativo

// Detectamos el puerto dinámicamente
const esPuertoAdmin = window.location.port === '5174';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {esPuertoAdmin ? <Admin /> : <App />}
  </React.StrictMode>,
)