/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Playfair Display', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Cormorant Garamond', 'Playfair Display', 'serif'],
      },
      colors: {
        border: 'rgb(214 214 214)',
        input: 'rgb(214 214 214)',
        ring: 'rgb(147 51 234)',
        background: 'rgb(255 255 255)',
        foreground: 'rgb(15 15 15)',
        primary: {
          DEFAULT: 'rgb(147 51 234)',
          foreground: 'rgb(248 250 252)',
          light: 'rgb(168 85 247)'
        },
        secondary: {
          DEFAULT: 'rgb(241 245 249)',
          foreground: 'rgb(15 23 42)'
        },
        destructive: {
          DEFAULT: 'rgb(239 68 68)',
          foreground: 'rgb(248 250 252)'
        },
        muted: {
          DEFAULT: 'rgb(241 245 249)',
          foreground: 'rgb(100 116 139)'
        },
        accent: {
          DEFAULT: 'rgb(241 245 249)',
          foreground: 'rgb(15 23 42)'
        },
        popover: {
          DEFAULT: 'rgb(255 255 255)',
          foreground: 'rgb(15 15 15)'
        },
        card: {
          DEFAULT: 'rgb(255 255 255)',
          foreground: 'rgb(15 15 15)'
        },
        muse: {
          mauve: 'rgb(221, 190, 216)',
          lavender: 'rgb(230, 224, 244)',
          dustyRose: 'rgb(217, 175, 195)',
          mistyPearl: 'rgb(248, 245, 250)',
          deepMauve: 'rgb(193, 154, 188)',
          softPink: 'rgb(236, 204, 227)',
          whisperLavender: 'rgb(244, 240, 250)'
        }
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem',
        '42': '10.5rem',
        '46': '11.5rem',
        '50': '12.5rem',
        '54': '13.5rem',
        '58': '14.5rem',
        '62': '15.5rem',
        '66': '16.5rem',
        '70': '17.5rem',
        '74': '18.5rem',
        '78': '19.5rem',
        '82': '20.5rem',
        '86': '21.5rem',
        '90': '22.5rem',
        '94': '23.5rem',
        '98': '24.5rem',
        '102': '25.5rem',
        '106': '26.5rem',
        '110': '27.5rem',
        '114': '28.5rem',
        '118': '29.5rem',
        '122': '30.5rem',
        '126': '31.5rem',
        '130': '32.5rem',
      }
    },
  },
  plugins: [],
}
