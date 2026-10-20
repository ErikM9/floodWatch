import { getFloodWarningsFromDB } from '@/chrome-extension/services/floodDatabase';
import { FloodResponse } from '@/types/api';

export const FLOODS_URL =
  'https://environment.data.gov.uk/flood-monitoring/id/floods';
export const OUTLINES_URL =
  'https://environment.data.gov.uk/flood-monitoring/id/floodAreas/';

interface DownloadEvents {
  outlinesExpected: (total: number) => void;
  outlineDone: () => void;
}

const outlinedAreas = () =>
  getFloodWarningsFromDB()
    .catch(() => [])
    .then(
      (stored) =>
        new Set(
          stored
            .filter((warning) => warning.polygonData.length)
            .map((warning) => warning.id),
        ),
    );

/* Watches the extension's requests to the Environment Agency, to show the first download's progress and any failure */
export function watchDownloads(
  events: DownloadEvents,
  target: { fetch: typeof fetch } = window,
) {
  const send = target.fetch.bind(target);
  let firstList = true;
  let latestFailed = false;

  target.fetch = async (input, init) => {
    const url = String(input);

    if (url === FLOODS_URL) {
      /* Only the first download shows its progress, so only it needs the outlines stored already */
      const outlined = firstList && (await outlinedAreas());
      firstList = false;

      let response: Response;
      try {
        response = await send(input, init);
      } catch (error) {
        latestFailed = true;
        throw error;
      }

      /* The extension reads the original response, so a copy that won't parse only counts as a failed download */
      try {
        const { items }: FloodResponse = await response.clone().json();
        if (outlined) {
          events.outlinesExpected(
            items.filter((item) => !outlined.has(item.floodAreaID)).length,
          );
        }
        latestFailed = !response.ok;
      } catch {
        latestFailed = true;
      }
      return response;
    }

    if (url.startsWith(OUTLINES_URL)) {
      try {
        return await send(input, init);
      } finally {
        events.outlineDone();
      }
    }

    return send(input, init);
  };

  return { latestFailed: () => latestFailed };
}