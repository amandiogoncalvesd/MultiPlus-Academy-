/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A2E5D',
          dark: '#061B37',
          light: '#1A4D8D',
        },
        secondary: {
          DEFAULT: '#C89B3C',
          dark: '#9F7523',
          light: '#DFB96C',
        },
        slate: {
          950: '#030712'
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Outfit", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
