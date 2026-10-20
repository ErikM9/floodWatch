import path from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import babel from '@rollup/plugin-babel';

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
      ],
    }),

    mode === 'production' &&
      babel({
        babelHelpers: 'bundled',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        plugins: ['transform-remove-console'],
      }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'popup.html'),
        options: path.resolve(__dirname, 'options.html'),
        background: path.resolve(
          __dirname,
          'src/chrome-extension/background.ts',
        ),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
}));