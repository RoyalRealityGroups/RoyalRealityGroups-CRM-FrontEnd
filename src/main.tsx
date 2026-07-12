import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/accessibility.css'
import App from './App.tsx'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

createRoot(document.getElementById('root')!).render(
  <LocalizationProvider
    dateAdapter={AdapterDayjs}
    dateFormats={{ keyboardDate: 'DD-MM-YYYY', shortDate: 'DD-MM-YYYY', normalDate: 'DD-MM-YYYY' }}
  >
    <App />
  </LocalizationProvider>,
)
