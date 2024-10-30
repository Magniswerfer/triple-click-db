import { type Config } from "tailwindcss";

export default {
  content: ["{routes,islands,components}/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdfd",
          100: "#ccf7f9",
          200: "#99ecf0",
          300: "#66e0e7",
          400: "#33d5de",
          500: "#18A5B1", // Original teal
          600: "#138591",
          700: "#0e6570",
          800: "#0a454e",
          900: "#05242d",
        },
        secondary: {
          50: "#eaecf5",
          100: "#d5d9eb",
          200: "#aab3d7",
          300: "#808ec3",
          400: "#5568af",
          500: "#222C6A", // Original blue
          600: "#1b2355",
          700: "#141a40",
          800: "#0d112b",
          900: "#060816",
        },
        accent: {
          50: "#fde9ea",
          100: "#fbd3d5",
          200: "#f7a7ab",
          300: "#f37b81",
          400: "#ef4f57",
          500: "#E3222E", // Original red
          600: "#b61b25",
          700: "#89141c",
          800: "#5c0d13",
          900: "#2f060a",
        },
        light: {
          50: "#fefef7",
          100: "#fdfdef",
          200: "#fbfbdf",
          300: "#faf9cf",
          400: "#f8f6bf",
          500: "#F7F4A7", // Original yellow
          600: "#c5c386",
          700: "#939264",
          800: "#626243",
          900: "#313121",
        },
      },
    },
  },
} satisfies Config;
