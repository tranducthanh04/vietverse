/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E04836', // Đỏ son
          hover: '#C83827',
          light: '#FEE2E2',
          dark: '#991B1B',
        },
        accent: {
          DEFAULT: '#FBBF24', // Vàng hoa mai
          hover: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        cream: {
          DEFAULT: '#FFFDF7', // Nền kem
          muted: '#F8F5EC',
          border: '#EFE9D9',
        },
        culture: {
          DEFAULT: '#059669', // Xanh lá dong văn hóa
          hover: '#047857',
          light: '#D1FAE5',
          dark: '#064E3B',
        },
        kidSuccess: {
          DEFAULT: '#10B981', // Xanh lá thành công
          hover: '#059669',
          light: '#D1FAE5',
        },
        kidSky: {
          DEFAULT: '#38BDF8',
          hover: '#0EA5E9',
          light: '#E0F2FE',
        },
        kidPurple: {
          DEFAULT: '#A855F7',
          hover: '#9333EA',
          light: '#F3E8FF',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'Baloo 2', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', 'Nunito', 'cursive', 'sans-serif'],
      },
      fontSize: {
        'kid-sm': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'kid-base': ['1.25rem', { lineHeight: '1.875rem' }], // 20px
        'kid-lg': ['1.5rem', { lineHeight: '2rem' }], // 24px
        'kid-xl': ['1.75rem', { lineHeight: '2.25rem' }], // 28px
        'kid-2xl': ['2rem', { lineHeight: '2.5rem' }], // 32px
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
