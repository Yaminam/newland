import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { compression } from 'vite-plugin-compression2'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Gzip compression for production builds
    compression({ algorithms: ['gzip'], threshold: 1024 }),
    // Brotli compression (20-30% smaller than gzip)
    compression({ algorithms: ['brotliCompress'], threshold: 1024 }),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  build: {
    // Enable source maps only in dev
    sourcemap: false,
    // Minification
    minify: 'esbuild',
    // Target modern browsers for smaller output
    target: 'es2020',
    // CSS code splitting
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-motion': ['framer-motion'],
          'vendor-charts': ['recharts'],
          'vendor-editor': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-image', '@tiptap/extension-link', '@tiptap/extension-placeholder'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
          ],
          'vendor-dnd': ['@hello-pangea/dnd'],
          'vendor-icons': ['lucide-react'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority', 'sonner'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Allow local network access for mobile testing. Vite's allowedHosts only
    // accepts strings (no RegExp). LAN IPs (e.g. 192.168.x.x) are allowed by
    // Vite automatically; '.local' permits mDNS hostnames for phones on Wi-Fi.
    allowedHosts: ['localhost', '127.0.0.1', '.local'],
    // Security headers for the dev server.
    // CSP and HSTS are intentionally omitted here — they belong only in
    // production (_headers / vercel.json). In dev, Vite injects an inline
    // <script> for @vitejs/plugin-react Fast Refresh; a strict script-src
    // policy blocks it and breaks HMR entirely.
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  }
})
