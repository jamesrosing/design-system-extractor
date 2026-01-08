/** @type {import('tailwindcss').Config} */
// Generated from Vercel design system extraction
// Source: https://vercel.com/
// Extracted: 2026-01-05

module.exports = {
  theme: {
    extend: {
      colors: {
        // Grayscale (Vercel's primary palette)
        gray: {
          100: '#fafafa',
          200: '#ebebeb',
          300: '#e6e6e6',
          400: '#999999',
          500: '#888888',
          600: '#666666',
          700: '#444444',
          800: '#333333',
          900: '#171717',
          1000: '#000000',
        },
        
        // Background
        background: {
          DEFAULT: '#ffffff',
          secondary: '#fafafa',
          tertiary: '#f5f5f5',
          inverted: '#171717',
        },
        
        // Accent colors
        blue: {
          100: '#ebf5ff',
          200: '#cce6ff',
          500: '#0070f3',
          600: '#0062d1',
          700: '#0068d6',
          light: '#52aeff',
        },
        
        // Semantic colors
        success: {
          DEFAULT: '#297a3a',
          light: '#6cda75',
          dark: '#398e4a',
        },
        error: {
          DEFAULT: '#e5484d',
          dark: '#cb2a2f',
        },
        warning: {
          DEFAULT: '#ffb224',
          dark: '#ff990a',
        },
        
        // Additional accents
        purple: {
          DEFAULT: '#7820bc',
          light: '#bf89ec',
        },
        pink: {
          DEFAULT: '#bd2864',
          light: '#ea3e83',
        },
        teal: {
          DEFAULT: '#067a6e',
          light: '#45dec5',
        },
      },
      
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '24px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['32px', { lineHeight: '40px' }],
        '5xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.96px' }],
        '6xl': ['48px', { lineHeight: '56px', letterSpacing: '-2.88px' }],
      },
      
      spacing: {
        // Vercel uses 4px base grid
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '16': '64px',
        '24': '96px',
      },
      
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '64px',
        full: '9999px',
      },
      
      boxShadow: {
        'vercel-sm': 'rgba(0, 0, 0, 0.04) 0px 2px 2px 0px',
        'vercel-md': 'rgba(0, 0, 0, 0.08) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 2px 2px 0px, rgb(250, 250, 250) 0px 0px 0px 1px',
        'vercel-lg': 'rgba(0, 0, 0, 0.08) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 2px 2px 0px, rgba(0, 0, 0, 0.04) 0px 8px 8px -8px, rgb(250, 250, 250) 0px 0px 0px 1px',
        'vercel-border': 'rgb(235, 235, 235) 0px 0px 0px 1px',
        'vercel-border-focus': 'rgb(235, 235, 235) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px',
      },
      
      transitionDuration: {
        fast: '100ms',
        normal: '150ms',
        slow: '200ms',
        slower: '300ms',
      },
      
      transitionTimingFunction: {
        'vercel': 'cubic-bezier(0.33, 0.12, 0.15, 1)',
        'vercel-bounce': 'cubic-bezier(0.31, 0.05, 0.43, 1.02)',
        'vercel-smooth': 'cubic-bezier(0.39, 0.18, 0.17, 0.99)',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'rotateX(-30deg) scale(0.9)' },
          '100%': { opacity: '1', transform: 'rotateX(0deg) scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'rotateX(0deg) scale(1)' },
          '100%': { opacity: '0', transform: 'rotateX(-10deg) scale(0.95)' },
        },
        slideFromBottom: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideFromRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(75%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        bounce: {
          '0%, 100%': { 
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': { 
            transform: 'none',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.33, 0.12, 0.15, 1)',
        'scale-out': 'scaleOut 0.15s cubic-bezier(0.33, 0.12, 0.15, 1)',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-from-bottom': 'slideFromBottom 0.3s ease-out',
        'slide-from-right': 'slideFromRight 0.3s ease-out',
        spin: 'spin 1s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      
      maxWidth: {
        container: '1200px',
        content: '1080px',
        narrow: '720px',
      },
    },
  },
};
