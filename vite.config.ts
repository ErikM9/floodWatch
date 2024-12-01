import { resolve } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import babel from '@rollup/plugin-babel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'src/chrome-extension/manifest.json', dest: '.' },
        { src: 'src/chrome-extension/public/16.png', dest: './public' },
        { src: 'src/chrome-extension/public/32.png', dest: './public' },
        { src: 'src/chrome-extension/public/48.png', dest: './public' },
        { src: 'src/chrome-extension/public/128.png', dest: './public' },
        { src: 'src/chrome-extension/public/192.png', dest: './public' },
      ],
    }),

    mode === 'production' &&
      babel({
        babelHelpers: 'bundled',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        plugins: mode === 'production' ? ['transform-remove-console'] : [],
      }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    open: '/popup-local.html',
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html'),
        background: resolve(__dirname, 'src/chrome-extension/background.ts'),
        content: resolve(__dirname, 'src/chrome-extension/content.ts'),
        service: resolve(
          __dirname,
          'src/chrome-extension/services/FloodDataService.ts',
        ),
      },
      output: {
        entryFileNames: '[name].js',
      },
      external: mode === 'production' ? ['@data/floodMockData'] : [],
    },
  },
}));
