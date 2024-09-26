import "../global.css";
import { Settings2 } from 'lucide-react';

export const Popup = () => {

  const openOptionsPage = () => {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    }
  };


  return (
    <header>
      <div>
        <div><img src="/src/chrome-extension/public/32.png" alt="" /></div>
        <div><h4>FloodWatch</h4></div>
      </div>

      <ul>
        <li>
          <Settings2
            size={20}
            className='cursor-pointer'
            onClick={openOptionsPage}
          />
        </li>
      </ul>
    </header>
  );
};
