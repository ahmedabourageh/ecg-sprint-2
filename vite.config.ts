import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// base './' makes the built app work from any subpath (GitHub Pages project
// sites, Netlify drops) without configuration. The alias swaps the original
// platform library for the portable shim in src/platform.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@instinct/files': path.resolve(__dirname, 'src/platform/files.tsx'),
    },
  },
  build: {
    // The narrated audio ships as base64 data URIs inside src/ecg/audio/*.ts,
    // so the single-bundle output is large by design. Silence the size warning.
    chunkSizeWarningLimit: 20000,
  },
});
