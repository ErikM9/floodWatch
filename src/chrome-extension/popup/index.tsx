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
    chrome.storage.local.get(['alertsEnabled', 'lastFloodAlert'], (result) => {
      setAlertsEnabled(result.alertsEnabled ?? false);
      setAlertData(result.lastFloodAlert ?? null);
    });

    const storageListener = (changes: any, areaName: string) => {
      if (areaName === 'local') {
        if (changes.alertsEnabled) {
          setAlertsEnabled(changes.alertsEnabled.newValue);
        }
        if (changes.lastFloodAlert) {
          setAlertData(changes.lastFloodAlert.newValue);
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
      <div className="py-10">
        <div style={{ marginBottom: '16px' }}>
          <h2>Current Alert</h2>
          {alertData ? (
            <div>
              <p>
                <strong>Severity:</strong> {alertData.severity}
              </p>
              <p>
                <strong>Description:</strong> {alertData.description}
              </p>
              <p>
                <strong>Severity Level:</strong> {alertData.severityLevel}
              </p>
            </div>
          ) : (
            <p>No active alerts</p>
          )}
        </div>
        <div>
          <p>
            Alerts are currently <strong>{alertsEnabled ? 'ON' : 'OFF'}</strong>
          </p>
          <Button
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
