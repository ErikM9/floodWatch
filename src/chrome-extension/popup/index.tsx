import '../global.css';
import { Settings2 } from 'lucide-react';
import logoImage from './../public/logo.svg';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface popupMessage {
  severityLevel: string;
  description: string;
  severity: string;
}

export const Popup = () => {
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertData, setAlertData] = useState<popupMessage | null>(null);

  const openOptionsPage = () => {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

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
    <div className="flex flex-col items-center p-4 bg-gray-50 w-[350px] h-[561px]">
      <header className="flex flex-row justify-between px-2 py-2 bg-white drop-shadow-xl w-full">
        <div className="flex w-[150px] flex-row items-center justify-center">
          <img
            src={logoImage}
            className="w-full h-full object-contain"
            alt="FloodWatch icon"
          />
        </div>
        <ul className="flex items-center">
          <li className="pt-2">
            <Settings2
              size={20}
              className="cursor-pointer text-primaryFlood-dark"
              onClick={openOptionsPage}
            />
          </li>
        </ul>
      </header>
      <div className="shadow-lg px-2 flex mt-10 flex-col border-1">
        <div className="">
          <h2 className="text-xl font-medium mb-5">Current Alert</h2>
          {alertData ? (
            <div className="space-y-3 text-sm">
              <p>
                <strong>Severity:</strong> {alertData.severity}
              </p>
              <p>
                <strong>Description:</strong> {alertData.description}
              </p>
              <p>
                <strong>Severity Level:</strong>{' '}
                <span
                  className={severityClasses[Number(alertData.severityLevel)]}>
                  {severityTextMap[Number(alertData.severityLevel)] ||
                    'Unknown'}
                </span>
              </p>
              <div>
                <span>For more information check the option panel</span>
                <span>
                  <Button>Option</Button>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-base">No active alerts</p>
          )}
        </div>
        <div className="mt-9 pb-5 flex flex-col items-center justify-center">
          <p className="text-sm">
            Alerts are currently:{' '}
            <strong>{alertsEnabled ? 'ON' : 'OFF'}</strong>
          </p>
          <Button
            className="mt-5"
            onClick={toggleAlerts}
            style={{
              backgroundColor: alertsEnabled ? 'red' : 'green'
            }}>
            {alertsEnabled ? 'Turn OFF Alerts' : 'Turn ON Alerts'}
          </Button>
        </div>
      </div>
    </div>
  );
};
