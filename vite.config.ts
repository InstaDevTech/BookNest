import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { booksStub } from './server/booksStub.ts'

// https://vite.dev
export default defineConfig({
  plugins: [react(), booksStub()],
})