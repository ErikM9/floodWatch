import { version } from '@/chrome-extension/manifest.json';

const steps = [
  "Unzip the download. Inside is a folder called floodwatch, which holds the extension's files and its manifest.",
  'Open chrome://extensions in Chrome and turn on Developer mode with the switch in the top right corner of the page.',
  'Click Load unpacked, which appears once Developer mode is on, and choose the floodwatch folder with manifest.json in it.',
  'Pin FloodWatch from the puzzle piece next to the address bar. Open its popup and click Settings to save an address, then turn on alerts in the popup.',
];

export default function Install() {
  return (
    <section
      id="install"
      aria-labelledby="install-title"
      className="section-rule">
      <div className="wrap py-16 sm:py-24">
        <div className="flex flex-col items-center text-center">
          <h2 id="install-title" className="section-title">
            Install FloodWatch
          </h2>
          <p className="mt-4">
            Version {version}, built from the latest code on GitHub.
          </p>
          <a href="floodwatch.zip" download className="button-primary mt-6">
            Download FloodWatch
          </a>
          <p className="mt-6 max-w-[60ch] text-balance text-[15px] text-muted xl:text-base 2xl:text-lg">
            FloodWatch asks Chrome for storage, alarms and notifications, and
            for access to the Environment Agency's flood data, nothing more.
          </p>
        </div>
        <ol
          role="list"
          className="mt-12 grid gap-10 md:grid-cols-2 md:gap-x-16 xl:gap-x-28">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4 xl:gap-5">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-estuary font-display text-lg font-bold text-estuary xl:h-14 xl:w-14 xl:text-2xl 2xl:h-16 2xl:w-16 2xl:text-[1.75rem]">
                {index + 1}
              </span>
              <p className="pt-1 text-xl xl:pt-2 xl:text-2xl 2xl:text-[1.75rem] 2xl:leading-normal">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}