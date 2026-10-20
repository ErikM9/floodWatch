import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { fakeChrome } from '../support/chrome';

import { Popup } from '@/chrome-extension/popup/index';
import { AlertMessage } from '@/types/types';

const fossWarning: AlertMessage = {
  id: '122FWF738',
  description: 'River Foss at York city centre',
  county: 'York',
  severity: 'Flood warning',
  severityLevel: 2,
  message: 'Flooding is expected on Foss Islands Road.',
  riverOrSea: 'River Foss',
  timeMessageChanged: '2024-11-25T09:15:00',
};

/* Saves settings the way another page of the extension would, and waits until the popup has caught up */
const saveSettings = (settings: Record<string, unknown>) =>
  act(async () => {
    await chrome.storage.local.set(settings);
    await fakeChrome().idle();
  });

const settle = () => act(() => fakeChrome().idle());

const severityLine = (text: string) => screen.getByText(text).closest('p');

describe('Popup', () => {
  it('says the area has no active alerts and alerts are off when nothing is saved', async () => {
    render(<Popup />);
    await settle();

    expect(
      screen.getByText('Your area currently has no active alerts.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Alerts are currently:')).toHaveTextContent(
      'Alerts are currently: OFF',
    );
  });

  it('asks for an address while none is saved, and says what it checks once one is', async () => {
    render(<Popup />);
    await settle();
    const askedForAddress = screen.queryByText(
      'Save an address on the settings page, and FloodWatch will check it every minute.',
    );

    await saveSettings({ userLocation: [53.96, -1.08] });

    expect(askedForAddress).not.toBeNull();
    expect(
      screen.queryByText('Save an address on the settings page', {
        exact: false,
      }),
    ).toBeNull();
    expect(
      screen.getByText(
        "FloodWatch checks your address against the Environment Agency's warnings every minute.",
      ),
    ).toBeInTheDocument();
  });

  it('lists the three warning levels while there is no alert', async () => {
    render(<Popup />);
    await settle();

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual([
      'Severe: danger to life',
      'Warning: flooding expected',
      'Alert: flooding possible',
    ]);
  });

  it('shows the recorded alert and points to the full report', async () => {
    await saveSettings({ lastSentAlert: fossWarning });

    render(<Popup />);

    expect(await screen.findByText('Flood warning')).toHaveTextContent(
      'Severity: Flood warning',
    );
    expect(
      screen.getByText('River Foss at York city centre'),
    ).toHaveTextContent('Description: River Foss at York city centre');
    expect(
      screen.getByText('For a full flood report, open the', { exact: false }),
    ).toHaveTextContent(
      'For a full flood report, open the settings with the gear above.',
    );
  });

  it.each([
    [1, '1 - severe flooding, danger to life!', 'rgb(255, 0, 0)'],
    [
      2,
      '2 - flooding is expected, immediate action required!',
      'rgb(255, 165, 0)',
    ],
    [3, '3 - flooding is possible, be prepared!', 'rgb(33, 140, 237)'],
    [4, '4 - Warning no longer in force!', 'rgb(0, 128, 0)'],
  ])(
    'shows severity level %i as "%s" in its colour',
    async (severityLevel, text, colour) => {
      await saveSettings({ lastSentAlert: { ...fossWarning, severityLevel } });

      render(<Popup />);

      expect(await screen.findByText(text)).toHaveStyle({ color: colour });
      expect(severityLine(text)).toHaveTextContent(`Severity Level: ${text}`);
    },
  );

  it('shows a severity level it does not know as unknown', async () => {
    await saveSettings({ lastSentAlert: { ...fossWarning, severityLevel: 5 } });

    render(<Popup />);

    expect(await screen.findByText('Unknown')).toBeInTheDocument();
  });

  it('turns alerts off and on again, saving each choice', async () => {
    const user = userEvent.setup();
    await saveSettings({ alertsEnabled: true });
    render(<Popup />);

    await user.click(
      await screen.findByRole('button', { name: 'Turn OFF Alerts' }),
    );
    const afterTurningOff = await chrome.storage.local.get('alertsEnabled');
    await user.click(
      await screen.findByRole('button', { name: 'Turn ON Alerts' }),
    );

    expect(afterTurningOff).toEqual({ alertsEnabled: false });
    expect(await chrome.storage.local.get('alertsEnabled')).toEqual({
      alertsEnabled: true,
    });
    expect(
      await screen.findByRole('button', { name: 'Turn OFF Alerts' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Alerts are currently:')).toHaveTextContent(
      'Alerts are currently: ON',
    );
  });

  it('follows changes saved elsewhere while it is open', async () => {
    render(<Popup />);
    await settle();

    await saveSettings({ alertsEnabled: true, lastSentAlert: fossWarning });
    const whileFlooded = screen.queryByText('Flood warning');
    await saveSettings({ lastSentAlert: null });

    expect(whileFlooded).not.toBeNull();
    expect(screen.queryByText('Flood warning')).toBeNull();
    expect(
      screen.getByText('Your area currently has no active alerts.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Turn OFF Alerts' }),
    ).toBeInTheDocument();
  });

  it('opens the settings page in a new tab', () => {
    render(<Popup />);

    const settings = screen.getByRole('link', { name: 'Settings' });

    expect(settings).toHaveAttribute('href', '/options.html');
    expect(settings).toHaveAttribute('target', '_blank');
  });
});