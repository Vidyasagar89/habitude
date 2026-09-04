import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://<user>.github.io/habitude/ — asset URLs need this prefix.
  base: '/habitude/',
  plugins: [react()],
})
