/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="obsidian"]', '[data-theme="eclipse"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--card-foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--accent-foreground) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'squish-land': 'squish-land 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'teleport-out': 'teleport-out 0.4s ease-in forwards',
        'teleport-in': 'teleport-in 0.4s ease-out forwards',
        'saccade': 'saccade 3s ease-in-out infinite',
        'particle': 'particle 0.8s ease-out forwards',
        'confetti': 'confetti-fall 2s ease-out forwards',
        'jelly': 'jelly-bounce 0.6s ease-in-out',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'slideUp': 'slideUp 0.4s ease-out forwards',
        'slideDown': 'slideDown 0.4s ease-out forwards',
        'siren': 'siren-flash 0.5s ease-in-out infinite',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(var(--primary), 0.3)',
        'glow-lg': '0 0 40px rgba(var(--primary), 0.3)',
      },
    },
  },
  plugins: [],
};
