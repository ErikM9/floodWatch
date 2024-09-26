import "../global.css";
import { Settings2 } from 'lucide-react';

export const Popup = () => {

  const openOptionsPage = () => {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    }
  };


  return (
    <header className='flex flex-row justify-between px-2 pt-2'>
      <div className='flex flex-row'>
        <div><img src="public/32.png" className="w-10 h-10" alt="FloodWatch icon" /></div>
        <div className='flex justify-center items-center'><h4 className='text-2xl font-bold text-blue-700 px-3 '>FloodWatch</h4></div>
      </div>

      <ul>
        <li className='pt-2'>
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
