/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Kích hoạt Dark Mode qua class 'dark' trên thẻ html
  theme: {
    extend: {
      colors: {
        // Bảng màu tối giản phong cách Linear: Đơn sắc sắc nét, độ tương phản cao
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
      },
    },
  },
  plugins: [],
}
