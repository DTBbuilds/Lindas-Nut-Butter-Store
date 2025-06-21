/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'warm-beige': '#F5E8C7',
        'rich-brown': '#5C4033',
        'soft-green': '#A8B5A2',
        'golden-yellow': '#D4A017',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        lora: ['Lora', 'serif'],
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' },
        }
      },
      animation: {
        wiggle: 'wiggle 0.5s ease-in-out infinite',
      },
      backgroundImage: {
        'pattern': "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")"  
      },
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio')],
}
