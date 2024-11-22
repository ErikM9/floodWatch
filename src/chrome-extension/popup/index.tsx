import '../global.css';
import logoImage from './../public/logo.svg';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface popupMessage {
  severityLevel: string;
  severity: string;
  description: string;
}

export const Popup = () => {
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertData, setAlertData] = useState<popupMessage | null>(null);

  useEffect(() => {
    chrome.storage.local.get(['alertsEnabled', 'lastSentAlert'], (result) => {
      setAlertsEnabled(result.alertsEnabled ?? false);
      setAlertData(result.lastSentAlert ?? null);
    });

    const storageListener = (changes: any, areaName: string) => {
      if (areaName === 'local') {
        if (changes.alertsEnabled) {
          setAlertsEnabled(changes.alertsEnabled.newValue);
        }
        if (changes.lastSentAlert) {
          setAlertData(changes.lastSentAlert.newValue);
        }
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  const toggleAlerts = () => {
    const newState = !alertsEnabled;
    setAlertsEnabled(newState);
    chrome.storage.local.set({ alertsEnabled: newState }, () => {
      console.log(`Alerts are now ${newState ? 'ON' : 'OFF'}`);
    });
  };

  //TODO this is not used anymore. Recheck if need or not
  chrome.runtime.onMessage.addListener((message) => {
    console.log('Message received in popup:', message);

    if (message.type === 'update_popup') {
      const popupMessage = message.data;
      console.log('Popup message data:', popupMessage);
    }
  });

  const severityTextMap: { [key: number]: string } = {
    1: '1 - severe flooding, danger to life!',
    2: '2 - flooding is expected, immediate action required!',
    3: '3 - flooding is possible, be prepared!',
    4: '4 - Warning no longer in force!'
  };

  const severityClasses: { [key: number]: string } = {
    1: 'text-[#FF0000]',
    2: 'text-[#FFA500]',
    3: 'text-[#218ced]',
    4: 'text-[#008000]'
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 w-[350px] h-[561px]">
      <header className="flex flex-row items-center px-2 py-2 bg-white drop-shadow-xl w-full">
        <div className="flex w-[150px] h-[30px] items-center justify-center mx-auto">
          <img
            src={logoImage}
            className="max-w-full max-h-full object-contain"
            alt="FloodWatch icon"
          />
        </div>
      </header>

      <div className="px-4 flex flex-col justify-around items-center h-full">
        <div className="shadow-lg bg-white w-full h-auto px-2 flex mt-4 flex-col justify-evenly border rounded-lg">
          <div>
            <h2 className="text-xl pt-3 text-center font-medium mb-4">
              Current Alert
            </h2>
            {alertData ? (
              <div className="space-y-3 text-sm">
                <p>
                  <strong>Severity:</strong> {alertData.severity}
                </p>
                <p>
                  <strong>Severity Level:</strong>{' '}
                  <span
                    className={
                      severityClasses[Number(alertData.severityLevel)]
                    }>
                    {severityTextMap[Number(alertData.severityLevel)] ||
                      'Unknown'}
                  </span>
                </p>
                <p className="text-pretty">
                  <strong>Description:</strong> {alertData.description}
                </p>
                <div>
                  <p className="bg-yellow-100 p-4 border rounded-xl">
                    For a full flood report, click the{' '}
                    <span className="font-bold">settings</span> button.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-base text-center">No active alerts</p>
            )}
          </div>

          <div className="mt-5 pb-5 flex flex-col items-center justify-center">
            <p className="text-sm">
              Alerts are currently:{' '}
              <strong>{alertsEnabled ? 'ON' : 'OFF'}</strong>
            </p>
            <Button
              className={`mt-5 ${alertsEnabled ? 'bg-red-500' : 'bg-green-500'} text-white`}
              onClick={toggleAlerts}>
              {alertsEnabled ? 'Turn OFF Alerts' : 'Turn ON Alerts'}
            </Button>
          </div>
        </div>

        <div className="mt-5 mb-5">
          <Button asChild className="bg-primaryFlood-dark text-white">
            <a href="/options.html" target="_blank" rel="noopener noreferrer">
              Settings
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};
