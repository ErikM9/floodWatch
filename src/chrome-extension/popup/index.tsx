import '../global.css';
import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

import logoImage from './../public/logo.svg';
import { severityLevels } from '../severity';

import { Button } from '@/components/ui/button';
import { AlertMessage } from '@/types/types';

const levelNames = [
  [1, 'Severe: danger to life'],
  [2, 'Warning: flooding expected'],
  [3, 'Alert: flooding possible'],
] as const;

export const Popup = () => {
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertData, setAlertData] = useState<AlertMessage | null>(null);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(
      ['alertsEnabled', 'lastSentAlert', 'userLocation'],
      (result) => {
        setAlertsEnabled(result.alertsEnabled ?? false);
        setAlertData(result.lastSentAlert ?? null);
        setHasLocation(Boolean(result.userLocation));
      },
    );

    const storageListener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === 'local') {
        if (changes.alertsEnabled) {
          setAlertsEnabled(changes.alertsEnabled.newValue);
        }
        if (changes.lastSentAlert) {
          setAlertData(changes.lastSentAlert.newValue);
        }
        if (changes.userLocation) {
          setHasLocation(Boolean(changes.userLocation.newValue));
        }
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  const toggleAlerts = () => {
    chrome.storage.local.set({ alertsEnabled: !alertsEnabled });
  };

  const severity = alertData && severityLevels[alertData.severityLevel];

  return (
    <div className="flex flex-col items-center bg-gray-50 w-[350px]">
      <header className="relative flex flex-row items-center px-2 py-3 bg-white w-full">
        <div className="flex w-[230px] h-[30px] items-center justify-center mx-auto">
          <img
            src={logoImage}
            className="max-w-full max-h-full object-contain"
            alt="FloodWatch icon"
          />
        </div>
        <a
          href="/options.html"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Settings"
          className="absolute right-2 top-[7px] rounded-md p-1.5 text-black transition-colors duration-300 hover:text-alert">
          <Settings size={27} aria-hidden="true" />
        </a>
      </header>

      <div className="px-4 pb-4 flex flex-col items-center w-full">
        <div className="bg-white w-full px-2 flex flex-col border border-line rounded-lg">
          <div>
            <h2 className="text-xl pt-3 text-center font-medium mb-4">
              Current Alert
            </h2>
            {alertData ? (
              <div className="space-y-3 overflow-y-auto text-sm">
                <p>
                  <strong>Severity:</strong> {alertData.severity}
                </p>
                <p>
                  <strong>Severity Level:</strong>{' '}
                  <span style={{ color: severity?.colour }}>
                    {severity
                      ? `${alertData.severityLevel} - ${severity.text}`
                      : 'Unknown'}
                  </span>
                </p>
                <p className="text-pretty">
                  <strong>Description:</strong> {alertData.description}
                </p>
                <div>
                  <p className="bg-yellow-100 p-4 border border-line text-center text-pretty rounded-xl">
                    For a full flood report, open the{' '}
                    <span className="font-bold">settings</span> with the gear
                    above.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-lg text-pretty">
                  Your area currently has no active alerts.
                </p>
                <p className="text-sm text-gray-600 text-pretty">
                  {hasLocation
                    ? "FloodWatch checks your address against the Environment Agency's warnings every minute."
                    : 'Save an address on the settings page, and FloodWatch will check it every minute.'}
                </p>
                <ul className="mx-auto w-fit space-y-1.5 text-sm text-left">
                  {levelNames.map(([level, name]) => (
                    <li key={level} className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 rounded-full border border-black/30"
                        style={{ background: severityLevels[level].colour }}
                      />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-5 pb-5 flex flex-col items-center justify-center">
            <p className="text-sm">
              Alerts are currently:{' '}
              <strong>{alertsEnabled ? 'ON' : 'OFF'}</strong>
            </p>
            {/* Each button darkens within its own colour on hover */}
            <Button
              className={`mt-5 ${alertsEnabled ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'} text-white`}
              onClick={toggleAlerts}>
              {alertsEnabled ? 'Turn OFF Alerts' : 'Turn ON Alerts'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};