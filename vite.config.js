import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Esto asegura que las rutas de los assets sean relativas
  base: './' 
})