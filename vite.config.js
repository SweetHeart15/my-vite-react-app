import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // This tells Vite: "Every time you see this exact string in my code, 
    // replace it with my Vercel environment variable."
    "'http://localhost:8000'": "import.meta.env.VITE_API_URL"
  }
})