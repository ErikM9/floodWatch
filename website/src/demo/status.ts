import { DemoState } from './store';

const clock = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
});

const counted = (count: number, one: string, many: string) =>
  count ? [`${count} ${count === 1 ? one : many}`] : [];

/* Joins a list the way a sentence would, with "and" before the last item */
const sentenceList = (items: string[]) =>
  items.length > 1
    ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
    : items[0];

/* Says what the demo knows of the warnings in force, in words which only change when that does */
export function describeStatus(state: DemoState): string {
  if (!state.firstCheckDone) {
    return 'Downloading the flood warnings in force from the Environment Agency.';
  }

  if (state.storageBlocked) {
    return "This browser doesn't let the page save data, which the demo needs for the warnings it downloads. Allow this site to save data, then reload the page.";
  }

  if (state.latestFailed && !state.stored) {
    return "The Environment Agency's flood warnings couldn't be downloaded. FloodWatch tries again every minute.";
  }

  if (state.latestFailed) {
    return state.checkedAt
      ? `The latest download from the Environment Agency failed, so the map shows the warnings downloaded at ${clock.format(state.checkedAt)}. FloodWatch tries again every minute.`
      : "The Environment Agency's flood warnings couldn't be downloaded, so the map shows the ones downloaded on an earlier visit. FloodWatch tries again every minute.";
  }

  const inForce = [
    ...counted(
      state.inForce.severe,
      'severe flood warning',
      'severe flood warnings',
    ),
    ...counted(state.inForce.warnings, 'flood warning', 'flood warnings'),
    ...counted(state.inForce.alerts, 'flood alert', 'flood alerts'),
  ];

  return inForce.length
    ? `In force in England right now: ${sentenceList(inForce)}.`
    : 'No flood warnings or alerts are in force in England right now.';
}

/* Gives the time of the latest check on a 24-hour clock, or nothing when its download failed */
export function describeCheckTime(state: DemoState): string {
  return state.checkedAt && !state.latestFailed
    ? `Checked at ${clock.format(state.checkedAt)}.`
    : '';
}