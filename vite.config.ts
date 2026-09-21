import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@renderer': resolve(__dirname, 'src')
    }
  },
  plugins: [react(), tailwindcss()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    modulePreload: {
      resolveDependencies(_filename: string, deps: string[]) {
        return deps.filter(
          (dep) => !dep.includes('mermaid') && !dep.includes('elk') && !dep.includes('dagre')
        )
      }
    },
    rollupOptions: {
      treeshake: true,
      output: {
        manualChunks(id: string): string | undefined {
          if (id.includes('node_modules')) {
            if (id.includes('katex')) {
              return 'vendor-katex'
            }
            if (id.includes('mermaid') || id.includes('elk') || id.includes('dagre')) {
              return 'vendor-mermaid'
            }
            if (id.includes('cytoscape')) {
              return 'vendor-cytoscape'
            }
            if (id.includes('@editorjs') || id.includes('editorjs-drag-drop')) {
              return 'vendor-editor'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react'
            }
          }
          return undefined
        }
      }
    }
  },
  worker: {
    format: 'es'
  }
})
