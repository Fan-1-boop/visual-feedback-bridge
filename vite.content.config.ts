import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Content Scripts are loaded as classic scripts by Chrome. Build this entry
 * separately as a self-contained IIFE so Rollup cannot emit ESM imports.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: resolve(__dirname, 'src/content/index.tsx'),
      output: {
        format: 'iife',
        name: 'VisualFeedbackBridgeContent',
        inlineDynamicImports: true,
        entryFileNames: 'content/index.js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
