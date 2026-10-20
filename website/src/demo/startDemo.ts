import { createChromeApi, installChrome } from './chromeApi';
import { watchDownloads } from './downloads';
import { DemoRuntime } from './runtime';
import { DemoStore } from './store';

import icon from '@/chrome-extension/public/128.png';
import { getFloodWarningsFromDB } from '@/chrome-extension/services/floodDatabase';

/* Runs the extension's service worker in the page, which stands in for Chrome for it and for the two demo frames */
export function startDemo(store: DemoStore): Promise<void> {
  const downloads = watchDownloads(store);
  const runtime = new DemoRuntime({
    notify: store.notify,
    openOptionsPage: store.openOptionsPage,
    getURL: (path) =>
      path === 'public/128.png'
        ? icon
        : new URL(path, new URL('demo/', document.baseURI)).href,
    settled: () => {
      void getFloodWarningsFromDB().then(
        (warnings) =>
          store.checkFinished(warnings, downloads.latestFailed(), Date.now()),
        store.storageFailed,
      );
    },
  });

  window.floodWatchDemo = runtime;
  installChrome(createChromeApi(runtime, window));

  return import('@/chrome-extension/background').then(() => runtime.install());
}