import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-solaire-static',
      closeBundle() {
        const files = ['dashboard-founder.html', 'dashboard-commercial.html', 'formulaire-recrutement.html']
        files.forEach(f => { if (fs.existsSync(f)) fs.copyFileSync(f, `dist/${f}`) })
        ;['css','js'].forEach(dir => {
          if (!fs.existsSync(dir)) return
          if (!fs.existsSync(`dist/${dir}`)) fs.mkdirSync(`dist/${dir}`, { recursive: true })
          fs.readdirSync(dir).forEach(f => fs.copyFileSync(`${dir}/${f}`, `dist/${dir}/${f}`))
        })
      }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
})
