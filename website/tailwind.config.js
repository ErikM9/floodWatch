import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: ['./index.html', './src/**/*.{ts,tsx}'],
  },
  theme: {
    extend: {
      colors: {
        ink: '#031C4E',
        estuary: '#033E8C',
        body: '#24364F',
        muted: '#4D5E75',
        tide: '#E4ECF7',
        line: '#D3DDEA',
        tint: '#D4E0F2',
        severe: '#FF0000',
        warning: '#FFA500',
        alert: '#218CED',
        lifted: '#008000',
      },
      fontFamily: {
        sans: ['Montserrat', ...defaultTheme.fontFamily.sans],
        display: ['"Kaisei Decol"', ...defaultTheme.fontFamily.serif],
      },
      maxWidth: {
        measure: '68ch',
      },
      boxShadow: {
        window: '0 8px 20px -14px rgba(3, 28, 78, 0.25)',
        popup: '0 4px 12px -4px rgba(3, 28, 78, 0.18)',
      },
    },
  },
};