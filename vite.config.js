import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages deployment configuration
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Set base path for GitHub Pages deployment
  // Change 'delta-exchange-journal' to your repository name
  base: '/delta-exchange-journal/',
})
