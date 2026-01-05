/** @type {import('tailwindcss').Config} */
// Generated from Linear design system extraction
// Source: https://linear.app/
// Extracted: 2026-01-05

module.exports = {
  theme: {
    extend: {
      colors: {
        // Core palette
        white: '#ffffff',
        black: '#000000',
        
        // Brand colors
        indigo: {
          DEFAULT: '#5e6ad2',
          light: '#6771c5',
        },
        
        // Semantic colors
        blue: '#4ea7fc',
        red: '#eb5757',
        green: {
          DEFAULT: '#4cb782',
          plan: '#68cc58',
          dark: '#2c901c',
        },
        orange: '#fc7840',
        yellow: {
          DEFAULT: '#f2c94c',
          build: '#d4b144',
          dark: '#deb949',
        },
        
        // Background colors (dark mode)
        background: {
          primary: '#0f1011',
          elevated: '#08090a',
          surface: '#28282c',
          'surface-subtle': '#1c1c1f',
          'surface-light': '#141516',
          'surface-hover': '#18191a',
          'surface-card': '#232326',
        },
        
        // Text colors
        text: {
          primary: '#f7f8f8',
          secondary: '#8a8f98',
          tertiary: '#d0d6e0',
          muted: '#62666d',
          quaternary: '#91959c',
        },
        
        // Border colors
        border: {
          DEFAULT: '#3e3e44',
          subtle: '#1c1c1f',
          strong: '#262728',
        },
        
        // Status colors
        status: {
          security: '#7a7fad',
        },
      },
      
      fontFamily: {
        sans: ['"Inter Variable"', '"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['"Tiempos Headline"', 'ui-serif', 'Georgia', 'Cambria', 'serif'],
        mono: ['"Berkeley Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '510',
        semibold: '590',
        bold: '680',
      },
      
      fontSize: {
        micro: ['0.625rem', { lineHeight: '1.5' }],         // 10px
        mini: ['0.75rem', { lineHeight: '1.4' }],           // 12px
        small: ['0.8125rem', { lineHeight: '1.5' }],        // 13px
        base: ['0.9375rem', { lineHeight: '1.6' }],         // 15px
        large: ['1.0625rem', { lineHeight: '1.6' }],        // 17px
        'title-1': ['1.0625rem', { lineHeight: '1.4', letterSpacing: '-0.012em' }],
        'title-2': ['1.3125rem', { lineHeight: '1.33', letterSpacing: '-0.012em' }],
        'title-3': ['1.5rem', { lineHeight: '1.33', letterSpacing: '-0.012em' }],
        'title-4': ['2rem', { lineHeight: '1.125', letterSpacing: '-0.022em' }],
        'title-5': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.022em' }],
        'title-6': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.022em' }],
        'title-7': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.022em' }],
        'title-8': ['4rem', { lineHeight: '1.06', letterSpacing: '-0.022em' }],
      },
      
      spacing: {
        // Linear uses a 4px grid
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '18': '72px',
        '24': '96px',
        '40': '160px',
      },
      
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        DEFAULT: '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },
      
      boxShadow: {
        'elevation-low': 'rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.08) 0px 0px 1px 0px',
        'elevation-medium': 'rgba(0, 0, 0, 0.2) 0px 4px 24px 0px',
        'elevation-high': 'rgba(0, 0, 0, 0.35) 0px 7px 32px 0px',
        'glow': 'rgba(255, 255, 255, 0.04) 0px 1.5px 5px 0px inset, rgba(255, 255, 255, 0.1) 0px -0.75px 0.75px 0px inset',
      },
      
      transitionDuration: {
        quick: '100ms',
        regular: '250ms',
        slow: '320ms',
      },
      
      transitionTimingFunction: {
        'out-quad': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'out-cubic': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
        'out-quart': 'cubic-bezier(0.165, 0.84, 0.44, 1)',
        'out-quint': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
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
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(4px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        blurOut: {
          '0%': { opacity: '1', filter: 'blur(0)' },
          '100%': { opacity: '0', filter: 'blur(4px)' },
        },
      },
      
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'fade-out': 'fadeOut 0.25s ease-out',
        'scale-in': 'scaleIn 0.16s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'scale-out': 'scaleOut 0.16s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'blur-in': 'blurIn 0.2s ease-out',
        'blur-out': 'blurOut 0.2s ease-out',
      },
      
      maxWidth: {
        page: '1024px',
        prose: '624px',
      },
      
      zIndex: {
        footer: '50',
        scrollbar: '75',
        header: '100',
        overlay: '500',
        popover: '600',
        'command-menu': '650',
        'dialog-overlay': '699',
        dialog: '700',
        toasts: '800',
        tooltip: '1100',
        'context-menu': '1200',
        'skip-nav': '5000',
        max: '10000',
      },
    },
  },
};
