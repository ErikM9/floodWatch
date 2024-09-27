import "../global.css";
import { Mail } from 'lucide-react';
import logoImage from './../public/logo.png'

const Options = () => {
  return (

    <div>
      <header className='flex flex-row justify-between px-10 pt-2 mb-14 bg-white drop-shadow-xl'>

        <div className='flex flex-row'>
          <div>
            <img src={logoImage} className="size-20" alt="FloodWatch icon" />
          </div>
          <div className='flex justify-center items-center'>
            <h4 className='text-xl font-bold text-blue-700 px-3'>FloodWatch</h4>
          </div>
        </div>
        <ul className='flex justify-center items-center'>
          <li className='pt-2'>
            <Mail
              size={35}
              className='cursor-pointer'
            />
          </li>
        </ul>
      </header>
      <section className='mx-16'>
        <div>
          <h1>Test</h1>
        </div>
      </section>

    </div >

  );
};

export default Options;
