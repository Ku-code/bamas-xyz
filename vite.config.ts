import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base path for deployment (empty for root, or set to repo name for GitHub Pages)
  base: process.env.BASE_PATH || '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core and router
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          
          // Three.js ecosystem
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three-vendor';
          }
          
          // MapLibre GL
          if (id.includes('maplibre-gl')) {
            return 'map-vendor';
          }
          
          // All Radix UI packages
          if (id.includes('@radix-ui')) {
            return 'radix-vendor';
          }
          
          // UI libraries
          if (id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }
          
          // Supabase
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-vendor';
          }
          
          // Form libraries
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform/resolvers')) {
            return 'form-vendor';
          }
          
          // Query library
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          
          // PDF libraries
          if (id.includes('react-pdf') || id.includes('pdf-lib')) {
            return 'pdf-vendor';
          }
          
          // Chart libraries
          if (id.includes('recharts') || id.includes('vis-network') || id.includes('react-force-graph')) {
            return 'chart-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
    // Copy 404.html for GitHub Pages SPA routing
    copyPublicDir: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'recharts'],
  },
}));
