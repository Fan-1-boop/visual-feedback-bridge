import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Plugin to copy manifest.json, icons and popup html to dist
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      // Copy manifest
      copyFileSync(resolve(__dirname, 'src/manifest.json'), resolve(__dirname, 'dist/manifest.json'));

      // Copy popup.html to correct location
      const popupDir = resolve(__dirname, 'dist/popup');
      if (!existsSync(popupDir)) mkdirSync(popupDir, { recursive: true });
      copyFileSync(resolve(__dirname, 'dist/src/popup/index.html'), resolve(popupDir, 'index.html'));

      // Copy icons
      const iconsDir = resolve(__dirname, 'dist/icons');
      if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
      const iconSrc = resolve(__dirname, 'public/icons');
      if (existsSync(iconSrc)) {
        ['icon16.png', 'icon48.png', 'icon128.png'].forEach((f) => {
          const src = resolve(iconSrc, f);
          if (existsSync(src)) {
            copyFileSync(src, resolve(iconsDir, f));
          }
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), copyExtensionFiles()],
  build: {
    outDir: 'dist',
    // A watch rebuild must not delete the independently built Content Script.
    emptyOutDir: mode !== 'watch-main',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background/index.js';
          return '[name]/[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    cssCodeSplit: false,
    // Keep extension assets as physical files in dist.
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}));
