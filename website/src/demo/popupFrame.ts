import { connectToDemo } from './frame';

/* The extension's settings button opens a new tab, so a click or middle click shows the demo's settings page instead */
function openSettings(event: MouseEvent) {
  if (
    event.button < 2 &&
    (event.target as Element).closest('a[href="/options.html"]')
  ) {
    event.preventDefault();
    void chrome.runtime.openOptionsPage();
  }
}

if (connectToDemo()) {
  document.addEventListener('click', openSettings, true);
  document.addEventListener('auxclick', openSettings, true);
  void import('@/popup');
}