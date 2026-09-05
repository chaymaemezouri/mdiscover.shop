import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#FAF3F3',
          100: '#F3E6E6',
          200: '#E8D4D5',
          300: '#D4B5B6',
          400: '#BC8F91',
          500: '#AC6D6F',
          600: '#945A5C',
          700: '#7D4A4C',
          800: '#663D3F',
          900: '#523233',
        },
        brand: {
          DEFAULT: '#AC6D6F',
          light: '#E8D4D5',
          muted: '#BC8F91',
          dark: '#7D4A4C',
        },
        gold: {
          50: '#FBF7ED',
          100: '#F5ECD3',
          200: '#EBD9A6',
          300: '#DFC06E',
          400: '#D4AF37',
          500: '#C5A028',
          600: '#A8861F',
          700: '#856819',
          800: '#6B5215',
          900: '#574312',
        },
        cream: {
          50: '#FDFCFA',
          100: '#FAF8F4',
          200: '#F5F1EA',
          300: '#EDE7DC',
        },
        charcoal: {
          50: '#F7F7F7',
          100: '#E3E3E3',
          200: '#C8C8C8',
          300: '#A4A4A4',
          400: '#818181',
          500: '#666666',
          600: '#515151',
          700: '#434343',
          800: '#383838',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        display: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        serif: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'hero-fade': 'heroFade 1.1s cubic-bezier(0.22, 1, 0.36, 1) both',
        'hero-image': 'heroImage 1.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        heroFade: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        heroImage: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
