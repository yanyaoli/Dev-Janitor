/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1890ff',
      },
    },
  },
  plugins: [],
  // Disable preflight to avoid conflicts with Ant Design
  corePlugins: {
    preflight: false,
  },
}
