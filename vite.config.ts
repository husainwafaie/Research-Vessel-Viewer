import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './src/data'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@store': path.resolve(__dirname, './src/store'),
      '@scene': path.resolve(__dirname, './src/scene'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },

  optimizeDeps: {
    include: ['three'],
  },

  build: {
    // Three.js alone is ~680 kB minified / 175 kB gzip — unavoidable for a
    // full 3D application.  Raise the limit to suppress the false alarm.
    chunkSizeWarningLimit: 700,

    rollupOptions: {
      output: {
        /**
         * Split vendor code into named chunks so the browser can cache each
         * layer independently.  App code changes on every deploy; Three.js
         * and React virtually never do, so they get their own long-lived chunks.
         *
         * Load order at runtime:
         *   vendor-react → vendor-three → vendor-r3f → vendor-fx → app
         */
        manualChunks: {
          // React runtime — changes almost never, longest cache lifetime
          'vendor-react': ['react', 'react-dom'],
          // Three.js core — largest single dep (~175 kB gzip)
          'vendor-three': ['three'],
          // R3F ecosystem including zustand (drei imports it internally —
          // listing zustand separately causes a circular-chunk warning)
          'vendor-r3f':   ['@react-three/fiber', '@react-three/drei', 'zustand'],
          // Post-processing passes
          'vendor-fx':    ['postprocessing', '@react-three/postprocessing'],
        },
      },
    },
  },
});
