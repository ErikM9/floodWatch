import '../global.css';
import { Settings2 } from 'lucide-react';
import logoImage from './../public/logo.png';

export const Popup = () => {
  const openOptionsPage = () => {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

  return (
    <header className="flex flex-row justify-between px-2 py-2 bg-white drop-shadow-xl">
      <div className="flex flex-row">
        <div>
          <img src={logoImage} className="w-10" alt="FloodWatch icon" />
        </div>
        <div className="flex justify-center items-center">
          <h4 className="text-xl font-bold text-blue-700 px-3">FloodWatch</h4>
        </div>
      </div>

      <ul>
        <li className="pt-2">
          <Settings2
            size={20}
            className="cursor-pointer"
            onClick={openOptionsPage}
          />
        </li>
      </ul>
    </header>
  );
};
