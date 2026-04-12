/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:         '#0B1F3A',
        'navy-mid':   '#122947',
        'navy-light': '#1A3A5C',
        red:          '#C8102E',
        'red-dark':   '#A50D24',
        'red-light':  '#FDECEA',
        surface:      '#F5F7FA',
        'surface-2':  '#EDF2F7',
        border:       '#E4E8EE',
        textmain:     '#0D0D0D',
        textsub:      '#4A5568',
        textmuted:    '#A0AEC0',
        success:      '#1A7A4A',
        'success-bg': '#E8F5EE',
        warning:      '#B45309',
        'warning-bg': '#FEF3C7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        500: '500',
        600: '600',
        700: '700',
        800: '800',
        900: '900',
      },
    },
  },
  plugins: [],
};

