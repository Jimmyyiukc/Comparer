import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
// `--mode single` produit un unique dist/index.html (JS/CSS intégrés) que l'on
// peut ouvrir directement dans un navigateur, sans serveur. Le build normal est
// inchangé.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  ...(mode === 'single'
    ? { build: { assetsInlineLimit: 100_000_000, cssCodeSplit: false } }
    : {}),
}))
