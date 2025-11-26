/** @type {import('tailwindcss').Config} */
const { heroui } = require("@heroui/react");

module.exports = {
	content: [
		"./index.html",
		"./src/**/*.{js,jsx}",
		"./node_modules/@heroui/react/**/*.{js,ts,jsx,tsx}"
	],
	darkMode: ["class"],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Google Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif']
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		heroui({
			themes: {
				light: {
					colors: {
						primary: "#1d4ed8", // azul 600
						success: "#16a34a"  // verde 600
					}
				},
				dark: {
					colors: {
						primary: "#1d4ed8",
						success: "#16a34a"
					}
				}
			}
		})
	]
};
