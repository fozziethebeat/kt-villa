import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  // Asset SVGs live in assets/src and are served/copied as static files.
  publicDir: 'public',
  server: { port: 5173, strictPort: true },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000, // Phaser alone is ~1.3 MB
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        catalog: resolve(__dirname, 'catalog.html'),
      },
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
} as any);
