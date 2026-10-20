import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Place } from '../demo/places';
import { DemoNotification } from '../demo/runtime';
import { describeCheckTime, describeStatus } from '../demo/status';
import { demoStore, DemoStore, useDemoState } from '../demo/store';

import { severityLevels } from '@/chrome-extension/severity';

const POPUP_WIDTH = 350;
/* The popup's height with no alert, which its frame takes until the page inside has been measured */
const POPUP_HEIGHT = 444;

/* The wave from the extension's logo, drawn in the current colour so it can change on hover */
function Wave() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 34 35"
      width={26}
      height={26}
      fill="currentColor">
      <path d="M23.571 34.185c-3.163 0-6.329-1.4-8.737-4.197-2.984-3.465-7.833-3.462-10.81 0-.922 1.072-2.411 1.072-3.333 0-.921-1.07-.921-2.802 0-3.873 4.816-5.597 12.655-5.597 17.475 0 2.982 3.462 7.83 3.46 10.81 0 .922-1.072 2.411-1.072 3.333 0 .921 1.07.921 2.802 0 3.873-2.407 2.797-5.572 4.197-8.738 4.197m0-10.958c-3.163 0-6.329-1.4-8.737-4.197-2.984-3.466-7.833-3.463-10.81 0-.922 1.071-2.411 1.071-3.333 0-.921-1.071-.921-2.803 0-3.874 4.816-5.597 12.655-5.597 17.475 0 2.982 3.463 7.83 3.46 10.81 0 .922-1.071 2.411-1.071 3.333 0 .921 1.071.921 2.803 0 3.874-2.407 2.797-5.572 4.197-8.738 4.197m0-10.958c-3.163 0-6.329-1.4-8.737-4.197-2.984-3.466-7.833-3.463-10.81 0-.922 1.07-2.411 1.07-3.333 0C-.23 7-.23 5.269.691 4.198c4.816-5.595 12.655-5.6 17.475 0 2.982 3.463 7.83 3.46 10.81 0 .922-1.071 2.411-1.071 3.333 0 .921 1.07.921 2.802 0 3.874-2.407 2.797-5.572 4.197-8.738 4.197" />
    </svg>
  );
}

function Notification({
  notification,
  onClose,
}: {
  notification: DemoNotification;
  onClose: () => void;
}) {
  return (
    <div
      role="alert"
      className="absolute bottom-3 right-3 z-10 flex w-[min(360px,calc(100%-24px))] gap-3 rounded-lg border border-line bg-white p-4 shadow-popup">
      <img src={notification.iconUrl} alt="" className="h-10 w-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{notification.title}</p>
        <p className="text-[15px] leading-snug">{notification.message}</p>
        <p className="mt-1 text-sm text-muted">FloodWatch</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close the notification"
        className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-tide hover:text-ink">
        <X aria-hidden="true" size={18} />
      </button>
    </div>
  );
}

export default function Demo({ store = demoStore }: { store?: DemoStore }) {
  const state = useDemoState(store);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupScale, setPopupScale] = useState(1);
  const [saved, setSaved] = useState<Place | null>(null);
  const [popupHeight, setPopupHeight] = useState<number | null>(null);
  const [settingsHeight, setSettingsHeight] = useState<number | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const settings = useRef<HTMLIFrameElement>(null);

  /* The popup is 350 pixels wide, as in Chrome, so it shrinks to fit a narrow screen */
  useEffect(() => {
    const fit = () => {
      const width = viewport.current?.clientWidth;
      if (width) setPopupScale(Math.min(1, (width - 16) / POPUP_WIDTH));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  /* The popup opens once the settings page is there to open it over, so it never hides the first download's progress */
  useEffect(() => {
    if (state.firstCheckDone) setPopupOpen(true);
  }, [state.firstCheckDone]);

  /* The popup's settings button closes it and moves focus to the settings page, or to the toolbar until that is there */
  useEffect(() => {
    if (state.optionsPageRequests) {
      setPopupOpen(false);
      (settings.current ?? toggle.current)?.focus();
    }
  }, [state.optionsPageRequests]);

  /* A press or focus in the settings page closes the popup, as Chrome closes a popup the user leaves */
  const closePopupOnLeave = (page: Document | null) => {
    page?.addEventListener('pointerdown', () => setPopupOpen(false));
    page?.addEventListener('focusin', () => setPopupOpen(false));
  };

  /* A frame's height follows its page's content, measured to the bottom of its last part, so nothing scrolls inside */
  const followHeight = (
    page: Document | null,
    setHeight: (height: number) => void,
  ) => {
    const root = page?.getElementById('root');
    const frame = page?.defaultView;
    if (!root || !frame) return;
    const follow = (content: Element) => {
      const observer = new frame.ResizeObserver(() => {
        const bottom = content.lastElementChild?.getBoundingClientRect().bottom;
        if (bottom) setHeight(bottom);
      });
      for (const part of content.children) observer.observe(part);
    };
    /* The page renders into the root after it loads, so the content to follow may still be on its way */
    if (root.firstElementChild) {
      follow(root.firstElementChild);
    } else {
      new frame.MutationObserver((_, observer) => {
        if (root.firstElementChild) {
          observer.disconnect();
          follow(root.firstElementChild);
        }
      }).observe(root, { childList: true });
    }
  };

  /* Focus goes to the toolbar when the notification closes, so it isn't lost along with the close button */
  const closeNotification = () => {
    store.dismissNotification();
    toggle.current?.focus();
  };

  /* The settings page's window is never shorter than the popup, so the popup doesn't hang out of it */
  const windowHeight =
    settingsHeight && Math.max(settingsHeight, (popupHeight ?? 0) + 8);

  const savePlace = (place: Place) => {
    void chrome.storage.local.set({ userLocation: place.location });
    setSaved(place);
  };

  return (
    <section aria-labelledby="demo-title" className="mt-16 sm:mt-24">
      <h2 id="demo-title" className="section-title">
        Try it with today's warnings
      </h2>
      <p className="section-intro">
        This is the extension itself, running in this page on the Environment
        Agency's live data. Search for an address in England on the settings
        page, then turn on alerts in the popup.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-center gap-3 border-b border-line bg-[#F7F9FC] px-3 py-2">
          <span aria-hidden="true" className="hidden gap-1.5 sm:flex">
            <span className="h-3 w-3 rounded-full bg-line" />
            <span className="h-3 w-3 rounded-full bg-line" />
            <span className="h-3 w-3 rounded-full bg-line" />
          </span>
          <span
            aria-hidden="true"
            className="min-w-0 flex-1 truncate rounded-full bg-tide px-4 py-1.5 text-sm text-muted">
            chrome-extension://floodwatch/options.html
          </span>
          <button
            ref={toggle}
            type="button"
            aria-controls="floodwatch-popup"
            aria-expanded={popupOpen}
            onClick={() => setPopupOpen((open) => !open)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-black transition-colors duration-300 hover:text-alert motion-reduce:transition-none">
            <Wave />
            <span className="sr-only">FloodWatch popup</span>
          </button>
        </div>

        <div
          ref={viewport}
          style={{ height: windowHeight ?? undefined }}
          className="relative h-[640px] sm:h-[760px]">
          {/* The popup comes first, so the keyboard reaches it straight after the toolbar button, as in Chrome */}
          <iframe
            id="floodwatch-popup"
            title="FloodWatch popup"
            src="demo/popup.html"
            hidden={!popupOpen}
            style={{
              transform: `scale(${popupScale})`,
              height: popupHeight ?? POPUP_HEIGHT,
            }}
            onLoad={(event) =>
              followHeight(event.currentTarget.contentDocument, setPopupHeight)
            }
            className="absolute -top-2 right-2 w-[350px] origin-top-right rounded-lg bg-white shadow-popup ring-1 ring-line"
          />
          {state.firstCheckDone ? (
            /* A new version of the map's areas loads the settings page again, as its map only reads them as it opens */
            <iframe
              key={state.mapVersion}
              ref={settings}
              title="FloodWatch settings page"
              src="demo/options.html"
              onLoad={(event) => {
                closePopupOnLeave(event.currentTarget.contentDocument);
                followHeight(
                  event.currentTarget.contentDocument,
                  setSettingsHeight,
                );
              }}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-[15px] text-muted">
              <progress
                aria-label="Downloading the flood warnings"
                max={state.outlines.total || undefined}
                value={state.outlines.total ? state.outlines.done : undefined}
                className="h-2 w-full max-w-xs accent-estuary"
              />
              {state.outlines.total > 0 && (
                <p>
                  Outlines of the flood areas: {state.outlines.done} of{' '}
                  {state.outlines.total}
                </p>
              )}
            </div>
          )}
          {state.notification && (
            <Notification
              notification={state.notification}
              onClose={closeNotification}
            />
          )}
        </div>
      </div>

      <p className="mx-auto mt-5 max-w-[80ch] text-balance text-center text-xl text-muted xl:text-2xl 2xl:text-3xl">
        <span role="status">{describeStatus(state)}</span>{' '}
        <span>{describeCheckTime(state)}</span>
      </p>

      {state.places.length > 0 && (
        <div className="mt-6 text-center">
          <p className="font-medium text-ink xl:text-lg 2xl:text-xl">
            Try a place with a warning in force:
          </p>
          <ul role="list" className="mt-3 flex flex-wrap justify-center gap-2">
            {state.places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => savePlace(place)}
                  className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-left text-[15px] text-ink hover:border-estuary xl:px-5 xl:py-2.5 xl:text-base 2xl:text-lg">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/30"
                    style={{
                      background: severityLevels[place.severityLevel].colour,
                    }}
                  />
                  <span>
                    {place.description},{' '}
                    <span className="whitespace-nowrap text-muted">
                      {place.severity}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p
            aria-live="polite"
            className="mt-3 text-base text-muted xl:text-lg 2xl:text-xl">
            {saved && `Saved a location in ${saved.description}.`}
          </p>
        </div>
      )}
    </section>
  );
}