import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isGitHubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  base: isGitHubPages ? '/airplane-physics-game/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
})
