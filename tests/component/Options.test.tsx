import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { fakeChrome } from '../support/chrome';
import { NOMINATIM_URL, searchPlaces } from '../support/nominatim';
import { requests, server, serviceUnavailable } from '../support/server';

import Options from '@/chrome-extension/options/index';
import { AlertMessage } from '@/types/types';

/* Leaflet needs a real browser to draw, so a stand-in shows the location the map is given */
vi.mock('@/chrome-extension/app-components/Map', () => ({
  default: ({ userLocation }: { userLocation: [number, number] | null }) => (
    <p>
      {userLocation
        ? `Map centred on ${userLocation.join(', ')}`
        : 'Map of England'}
    </p>
  ),
}));

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

const saveSettings = (settings: Record<string, unknown>) =>
  act(async () => {
    await chrome.storage.local.set(settings);
    await fakeChrome().idle();
  });

async function search(address: string) {
  const user = userEvent.setup();
  await user.type(
    await screen.findByRole('textbox', { name: /Location to monitor/ }),
    address,
  );
  await user.click(screen.getByRole('button', { name: 'View my location' }));
}

describe('Options', () => {
  it('shows the flood report recorded for the saved location', async () => {
    await saveSettings({ lastSentAlert: fossWarning });

    render(<Options />);

    expect(await screen.findByText('York')).toHaveTextContent('County: York');
    expect(screen.getByText('Flood warning')).toHaveTextContent(
      'Severity: Flood warning',
    );
    expect(screen.getByText('River Foss')).toHaveTextContent(
      'River or sea: River Foss',
    );
    expect(
      screen.getByText('Flooding is expected on Foss Islands Road.'),
    ).toHaveTextContent('Message: Flooding is expected on Foss Islands Road.');
    expect(screen.getByText('25th November 2024 09:15')).toHaveTextContent(
      'Last time the message was changed: 25th November 2024 09:15',
    );
    expect(
      screen.getByRole('link', { name: 'Environment Agency' }).closest('p'),
    ).toHaveTextContent('Flood report issued by the Environment Agency.');
    expect(
      screen.getByRole('link', { name: 'Environment Agency' }),
    ).toHaveAttribute(
      'href',
      'https://www.gov.uk/government/organisations/environment-agency',
    );
  });

  it('says when a warning gives no time for its message', async () => {
    await saveSettings({
      lastSentAlert: { ...fossWarning, timeMessageChanged: '' },
    });

    render(<Options />);

    expect(
      await screen.findByText('no information available'),
    ).toHaveTextContent(
      'Last time the message was changed: no information available',
    );
  });

  it('waits for the saved alert before saying there are no active alerts', async () => {
    await saveSettings({ lastSentAlert: fossWarning });

    render(<Options />);
    const beforeLoading = screen.queryByText(
      'Your area currently has no active alerts.',
    );

    expect(beforeLoading).not.toBeInTheDocument();
    expect(await screen.findByText('York')).toBeInTheDocument();
  });

  it('says there are no active alerts when none is recorded', async () => {
    render(<Options />);

    expect(
      await screen.findByText('Your area currently has no active alerts.'),
    ).toBeInTheDocument();
  });

  it('shows the saved location on the map', async () => {
    await saveSettings({ userLocation: [53.9590555, -1.0815361] });

    render(<Options />);

    expect(
      await screen.findByText('Map centred on 53.9590555, -1.0815361'),
    ).toBeInTheDocument();
  });

  it('follows a location saved in another tab', async () => {
    render(<Options />);
    await screen.findByText('Map of England');

    await saveSettings({ userLocation: [51.9925, -2.1601] });

    expect(
      screen.getByText('Map centred on 51.9925, -2.1601'),
    ).toBeInTheDocument();
  });

  it('saves the location of the address it finds and clears the field', async () => {
    render(<Options />);

    await search('York');

    expect(
      await screen.findByText('Map centred on 53.9590555, -1.0815361'),
    ).toBeInTheDocument();
    expect(await chrome.storage.local.get('userLocation')).toEqual({
      userLocation: [53.9590555, -1.0815361],
    });
    expect(
      screen.getByRole('textbox', { name: /Location to monitor/ }),
    ).toHaveValue('');
  });

  it('asks for an address instead of searching for a blank one', async () => {
    render(<Options />);

    await search('   ');

    expect(
      await screen.findByText('Please enter an address.'),
    ).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it.each([
    [
      'an address it cannot find',
      '1 Atlantis Road',
      "We couldn't find that address. Try adding the town or postcode.",
    ],
    [
      'an address outside England',
      'Cardiff',
      'That address is outside England. We only support locations in England.',
    ],
  ])(
    'explains why it cannot monitor %s and keeps what was typed',
    async (_case, address, explanation) => {
      render(<Options />);

      await search(address);

      expect(await screen.findByText(explanation)).toBeInTheDocument();
      expect(
        screen.getByRole('textbox', { name: /Location to monitor/ }),
      ).toHaveValue(address);
      expect(await chrome.storage.local.get('userLocation')).toEqual({});
    },
  );

  it('explains when the address search is not working', async () => {
    server.use(http.get(NOMINATIM_URL, () => serviceUnavailable()));
    render(<Options />);

    await search('York');

    expect(
      await screen.findByText(
        "We couldn't look up that address. Please try again.",
      ),
    ).toBeInTheDocument();
  });

  it('turns the search button off while a search is under way', async () => {
    let answer!: () => void;
    const answered = new Promise<void>((resolve) => {
      answer = resolve;
    });
    server.use(
      http.get(NOMINATIM_URL, async ({ request }) => {
        await answered;
        return HttpResponse.json(searchPlaces(new URL(request.url)));
      }),
    );
    render(<Options />);

    await search('York');
    const button = screen.getByRole('button', { name: 'View my location' });
    const disabledWhileSearching = (button as HTMLButtonElement).disabled;
    answer();

    expect(disabledWhileSearching).toBe(true);
    await vi.waitFor(() => expect(button).toBeEnabled());
  });

  it('updates the flood report when a new alert is recorded', async () => {
    render(<Options />);
    await screen.findByText('Your area currently has no active alerts.');

    await saveSettings({ lastSentAlert: fossWarning });

    expect(screen.getByText('York')).toHaveTextContent('County: York');
  });

  it("links to FloodWatch's website in a new tab from the header", () => {
    render(<Options />);

    const link = screen.getByRole('link', { name: "FloodWatch's website" });
    expect(link).toHaveAttribute(
      'href',
      'https://erikm9.github.io/floodWatch/',
    );
    expect(link).toHaveAttribute('target', '_blank');
  });
});