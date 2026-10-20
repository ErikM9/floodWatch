import { describe, expect, it } from 'vitest';

import {
  describeCheckTime,
  describeStatus,
} from '../../../website/src/demo/status';
import { DemoState, initialState } from '../../../website/src/demo/store';

const checked = (patch: Partial<DemoState>): DemoState => ({
  ...initialState,
  firstCheckDone: true,
  checkedAt: new Date(2026, 9, 20, 9, 5).getTime(),
  ...patch,
});

describe('describeStatus', () => {
  it('says the warnings are downloading until the first check is done, however far the outlines have got', () => {
    expect(
      describeStatus({ ...initialState, outlines: { done: 12, total: 40 } }),
    ).toBe(
      'Downloading the flood warnings in force from the Environment Agency.',
    );
  });

  it('says how to let the demo work when the browser stops the page saving data', () => {
    expect(describeStatus(checked({ storageBlocked: true }))).toBe(
      "This browser doesn't let the page save data, which the demo needs for the warnings it downloads. Allow this site to save data, then reload the page.",
    );
  });

  it("says the warnings couldn't be downloaded when there are none to show instead", () => {
    expect(
      describeStatus(checked({ latestFailed: true, checkedAt: null })),
    ).toBe(
      "The Environment Agency's flood warnings couldn't be downloaded. FloodWatch tries again every minute.",
    );
  });

  it('says when the warnings on the map were downloaded when the latest download fails', () => {
    expect(describeStatus(checked({ latestFailed: true, stored: 3 }))).toBe(
      'The latest download from the Environment Agency failed, so the map shows the warnings downloaded at 09:05. FloodWatch tries again every minute.',
    );
  });

  it('says the warnings on the map are from an earlier visit when none have downloaded on this one', () => {
    expect(
      describeStatus(
        checked({ latestFailed: true, stored: 3, checkedAt: null }),
      ),
    ).toBe(
      "The Environment Agency's flood warnings couldn't be downloaded, so the map shows the ones downloaded on an earlier visit. FloodWatch tries again every minute.",
    );
  });

  it('counts what is in force at each level, as a sentence', () => {
    expect(
      describeStatus(
        checked({ inForce: { severe: 1, warnings: 2, alerts: 21 } }),
      ),
    ).toBe(
      'In force in England right now: 1 severe flood warning, 2 flood warnings and 21 flood alerts.',
    );
    expect(
      describeStatus(
        checked({ inForce: { severe: 2, warnings: 0, alerts: 1 } }),
      ),
    ).toBe(
      'In force in England right now: 2 severe flood warnings and 1 flood alert.',
    );
    expect(
      describeStatus(
        checked({ inForce: { severe: 0, warnings: 1, alerts: 0 } }),
      ),
    ).toBe('In force in England right now: 1 flood warning.');
  });

  it('says when nothing is in force', () => {
    expect(describeStatus(checked({}))).toBe(
      'No flood warnings or alerts are in force in England right now.',
    );
  });
});

describe('describeCheckTime', () => {
  it('gives the time of the latest check on a 24-hour clock', () => {
    expect(describeCheckTime(checked({}))).toBe('Checked at 09:05.');
  });

  it('gives no time before the first check', () => {
    expect(describeCheckTime(initialState)).toBe('');
  });

  it("gives no time when the latest check's download failed", () => {
    expect(describeCheckTime(checked({ latestFailed: true }))).toBe('');
  });
});