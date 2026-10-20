import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/{unit,component}/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'html'],
        include: ['src/**/*.{ts,tsx}', 'website/src/**/*.{ts,tsx}'],
        exclude: [
          /* Generated shadcn/ui primitives */
          'src/components/ui/**',
          /* Entry points and the Leaflet map need a real browser to render */
          'src/popup.tsx',
          'src/options.tsx',
          'src/chrome-extension/app-components/**',
          'src/types/**',
          '**/*.d.ts',
          /* The website's pages and the frames of its demo run in a real browser, where the Playwright specs cover them */
          'website/src/main.tsx',
          'website/src/App.tsx',
          'website/src/components/**',
          'website/src/demo/startDemo.ts',
          'website/src/demo/frame.ts',
          'website/src/demo/popupFrame.ts',
          'website/src/demo/optionsFrame.ts',
        ],
        /* A few points under the measured coverage, so dropping tests fails CI while ordinary refactoring does not */
        thresholds: {
          lines: 95,
          statements: 95,
          branches: 95,
          functions: 85,
        },
      },
    },
  }),
);