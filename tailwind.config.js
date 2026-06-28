/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'surface-base': '#ffffff',
        'content-primary': '#0f172a',
        'content-secondary': '#334155',
        'border-primary': '#cbd5e1',
      },
    },
  },
  plugins: [],
}
