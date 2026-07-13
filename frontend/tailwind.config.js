import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        muted: 'hsl(var(--muted))',
        primary: 'hsl(var(--primary))',
        destructive: 'hsl(var(--destructive))',
        success: 'hsl(var(--success))',
        analytics: 'hsl(var(--analytics))'
      },
      boxShadow: {
        glass: '0 20px 60px rgba(15, 23, 42, 0.10)'
      }
    }
  },
  plugins: [animate]
};
