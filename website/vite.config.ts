import fs from 'fs';
import path from 'path';

import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { zipSync } from 'fflate';

const extensionBuild = path.resolve(__dirname, '../dist');

/* Reads every file of a folder, keyed by its path inside the zip */
function readFolder(
  folder: string,
  prefix: string,
): Record<string, Uint8Array> {
  return Object.fromEntries(
    fs
      .readdirSync(folder, { withFileTypes: true })
      .flatMap((entry) =>
        entry.isDirectory()
          ? Object.entries(
              readFolder(
                path.join(folder, entry.name),
                `${prefix}/${entry.name}`,
              ),
            )
          : [
              [
                `${prefix}/${entry.name}`,
                fs.readFileSync(path.join(folder, entry.name)),
              ],
            ],
      ),
  );
}

/* Zips the extension's build folder into the site as its download */
function extensionDownload(): Plugin {
  return {
    name: 'floodwatch-extension-download',
    apply: 'build',
    generateBundle() {
      if (!fs.existsSync(path.join(extensionBuild, 'manifest.json'))) {
        this.error('Build the extension with npm run build first');
      }
      this.emitFile({
        type: 'asset',
        fileName: 'floodwatch.zip',
        source: zipSync(readFolder(extensionBuild, 'floodwatch')),
      });
    },
  };
}

/* A relative base lets the same build run at the root of a server or under a path such as GitHub Pages' /floodWatch/ */
export default defineConfig({
  root: __dirname,
  base: './',
  publicDir: false,
  plugins: [react(), extensionDownload()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../site'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        popup: path.resolve(__dirname, 'demo/popup.html'),
        options: path.resolve(__dirname, 'demo/options.html'),
      },
    },
  },
});