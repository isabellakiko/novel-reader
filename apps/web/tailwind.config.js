/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 阅读器主题色（后续可扩展）
      },
      fontFamily: {
        // 阅读字体（后续可扩展）
      },
    },
  },
  plugins: [],
}
