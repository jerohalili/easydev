import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Project is deployed to GitHub Pages at https://<user>.github.io/easydev/,
  // not the domain root, so asset URLs need this prefix.
  base: '/easydev/',
  plugins: [react()],
})
