import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { startDemo } from './demo/startDemo';
import { demoStore } from './demo/store';
import './site.css';

void startDemo(demoStore);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);