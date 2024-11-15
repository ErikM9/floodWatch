//

/* eslint-disable @typescript-eslint/no-explicit-any */
import '../global.css';
import { Settings2 } from 'lucide-react';
import logoImage from './../public/logo.png';
import { useEffect, useState } from 'react';
import { Power, PowerOff } from 'lucide-react';

export const Popup = () => {
  const [notifsEnabled, setNotifsEnabled] = useState(false);
  const [floodWarnings, setFloodWarnings] = useState<any[]>([]);
  const [popupVisible, setPopupVisible] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['notifsEnabled'], (result) => {
      if (typeof result.notifsEnabled === 'boolean') {
        setNotifsEnabled(result.notifsEnabled);
      }
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'FLOOD_ALERT') {
        if (notifsEnabled) {
          setFloodWarnings(message.data);
          setPopupVisible(true);
        }
      }
    });
  }, [notifsEnabled]);

  const openOptionsPage = () => {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

  const toggleNotifs = () => {
    const updatedNotifsEnabled = !notifsEnabled;
    setNotifsEnabled(updatedNotifsEnabled);
    chrome.storage.local.set({ notifsEnabled: updatedNotifsEnabled });
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 w-[350px] h-[561px]">
      <header className="flex flex-row justify-between px-2 py-2 bg-white drop-shadow-xl w-full">
        <div className="flex flex-row">
          <img src={logoImage} className="w-10" alt="FloodWatch icon" />
          <h4 className="text-xl font-bold text-blue-700 px-3">FloodWatch</h4>
        </div>
        <ul className="flex items-center">
          <li className="pt-2">
            <Settings2
              size={20}
              className="cursor-pointer"
              onClick={openOptionsPage}
            />
          </li>
          <li className="pt-2">
            <button onClick={toggleNotifs} className="flex items-center">
              {notifsEnabled ? (
                <span className="text-green-500">
                  <Power />
                </span>
              ) : (
                <span className="text-red-500">
                  <PowerOff />
                </span>
              )}
            </button>
          </li>
        </ul>
      </header>

      {popupVisible && (
        <section className="flood-data mx-10 mt-4">
          <h4 className="text-lg font-bold text-blue-700">Flood Alerts</h4>
          {floodWarnings.length > 0 ? (
            <ul>
              {floodWarnings.map((flood, index) => (
                <li key={index}>
                  {/* <p>{flood.message}</p> */}
                  <p>{flood.description}</p>
                  <p>{flood.severity}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No flood alerts in your area.</p>
          )}
        </section>
      )}
    </div>
  );
};
