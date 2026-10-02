/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stitch Folk Play Semantic System
        surface: '#fff8f6',
        'surface-dim': '#e1d8d6',
        'surface-bright': '#fff8f6',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#fbf2f0',
        'surface-container': '#f5ecea',
        'surface-container-high': '#efe6e4',
        'surface-container-highest': '#e9e1df',
        'on-surface': '#1e1b1a',
        'on-surface-variant': '#5a413c',
        'outline': '#8e706b',
        'outline-variant': '#e2beb9',
        'surface-tint': '#b4281b',
        'on-primary': '#ffffff',
        'primary-container': '#d33f2e',
        'on-primary-container': '#fffbff',
        'primary-fixed': '#ffdad4',
        'primary-fixed-dim': '#ffb4a8',
        'on-primary-fixed': '#410000',
        'on-primary-fixed-variant': '#910a04',
        'on-secondary': '#ffffff',
        'secondary-container': '#fea619',
        'on-secondary-container': '#684000',
        'secondary-fixed': '#ffddb8',
        'secondary-fixed-dim': '#ffb95f',
        'on-secondary-fixed': '#2a1700',
        'on-secondary-fixed-variant': '#653e00',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#00855b',
        'on-tertiary-container': '#f5fff6',
        'tertiary-fixed': '#6ffbbe',
        'tertiary-fixed-dim': '#4edea3',
        'on-tertiary-fixed': '#002113',
        'on-tertiary-fixed-variant': '#005236',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        // VietVerse Brand Colors
        primary: {
          DEFAULT: '#b02518', // Đỏ son Stitch (#b02518 / #E04836)
          hover: '#910a04',
          light: '#ffdad4',
          dark: '#680000',
        },
        secondary: {
          DEFAULT: '#855300',
          hover: '#684000',
          light: '#ffddb8',
        },
        tertiary: {
          DEFAULT: '#006947',
          hover: '#005236',
          light: '#6ffbbe',
        },
        accent: {
          DEFAULT: '#fea619', // Vàng hoa mai
          hover: '#f59e0b',
          light: '#ffddb8',
          dark: '#684000',
        },
        cream: {
          DEFAULT: '#fff8f6', // Nền giấy Dó
          muted: '#f5ecea',
          border: '#e2beb9',
        },
        culture: {
          DEFAULT: '#006947', // Xanh lá tre văn hóa
          hover: '#005236',
          light: '#6ffbbe',
          dark: '#002113',
        },
        kidSuccess: {
          DEFAULT: '#00855b',
          hover: '#006947',
          light: '#6ffbbe',
        },
        kidSky: {
          DEFAULT: '#0284c7',
          hover: '#0369a1',
          light: '#e0f2fe',
        },
        kidPurple: {
          DEFAULT: '#a855f7',
          hover: '#9333ea',
          light: '#f3e8ff',
        }
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Nunito', 'sans-serif'],
        display: ['"Be Vietnam Pro"', '"Baloo 2"', 'sans-serif'],
      },
      fontSize: {
        'display-hero': ['44px', { lineHeight: '52px', fontWeight: '800' }],
        'display-hero-mobile': ['32px', { lineHeight: '40px', fontWeight: '800' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '700' }],
        'title-md': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-lg': ['16px', { lineHeight: '22px', fontWeight: '700' }],
        'label-md': ['14px', { lineHeight: '18px', fontWeight: '700' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '600' }],
        'kid-sm': ['1.125rem', { lineHeight: '1.75rem' }],
        'kid-base': ['1.25rem', { lineHeight: '1.875rem' }],
        'kid-lg': ['1.5rem', { lineHeight: '2rem' }],
        'kid-xl': ['1.75rem', { lineHeight: '2.25rem' }],
        'kid-2xl': ['2rem', { lineHeight: '2.5rem' }],
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
      boxShadow: {
        'kid': '0 8px 0px 0px rgba(0, 0, 0, 0.1)',
        'kid-primary': '0 6px 0px 0px #C83827',
        'kid-accent': '0 6px 0px 0px #D97706',
        'kid-success': '0 6px 0px 0px #059669',
        'kid-culture': '0 6px 0px 0px #047857',
        'kid-card': '0 10px 25px -5px rgba(224, 72, 54, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'kid': '1.5rem',
        'kid-lg': '2rem',
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 2s infinite ease-in-out',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      }
    },
  },
  plugins: [],
}
