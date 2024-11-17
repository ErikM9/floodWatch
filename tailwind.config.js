/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme');

export default {
  darkMode: ['class'],
  content: ['/popup-local.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: ['Montserrat', ...fontFamily.sans], // Montserrat for sans-serif
        heading: ['"Kaisei Decol"', ...fontFamily.serif] // Kaisei Decol for headings
      },
      colors: {
        // Custom Flood Monitoring Colors
        primaryFlood: {
          dark: '#031C4E', // Deep Blue
          DEFAULT: '#033E8C', // Steel Blue
          light: '#3F76A6' // Light blue
        },
        alert: {
          warning: '#FFBF00', // Amber for warnings
          critical: '#D9534F' // Red for critical alerts
        },
        neutral: {
          light: '#F5F5F5', // Light neutral color
          ultra: '#FCFCFC', // Ultra light for background
          dark: '#2D384C', // Dark Gray
          slate: '#274368', // Slate Gray
          small: '#004466'
        },
        success: '#25B32B', // Green for success
        interactive: '#2E5D9A', // Sky Blue for interactive elements

        accents: {
          primary: '#FFAE00', // Orange accent color
          secondary: '#FFE100' // Yellow accent color
        },

        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))'
        }
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
