import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import Options from './chrome-extension/options/index';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="bg-gray-50 w-full h-full">
      <Options />
    </div>
  </StrictMode>,
);