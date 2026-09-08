/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#211C1A',
        paper: '#EFE8DA',
        'paper-dim': '#E3DBC9',
        ember: '#C1432E',
        sage: '#4C6B54',
        'sage-dim': '#DCE5DC',
        amber: '#C8912B',
        muted: '#8B7E6A',
        white: '#FCFAF5',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Fraunces', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
