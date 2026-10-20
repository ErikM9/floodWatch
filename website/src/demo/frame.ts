import { createChromeApi, installChrome } from './chromeApi';
import { DemoRuntime } from './runtime';

const runtimeOf = (parent: Window): DemoRuntime | undefined => {
  try {
    return parent === window ? undefined : parent.floodWatchDemo;
  } catch {
    return undefined;
  }
};

/* Gives a demo frame the page's stand-in for Chrome, and sends anyone who opens a frame on its own to the page */
export function connectToDemo(): boolean {
  const runtime = runtimeOf(window.parent);

  if (!runtime) {
    window.location.replace(new URL('../', window.location.href));
    return false;
  }

  installChrome(createChromeApi(runtime, window));
  return true;
}