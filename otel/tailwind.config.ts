import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172126",
        cream: "#f6f4ef",
        teal: { 50: "#eef9f7", 100: "#d7f1ec", 500: "#2a8d7c", 600: "#217566", 700: "#195e53" },
        coral: "#e7795f",
      },
      boxShadow: { soft: "0 12px 32px rgba(23, 33, 38, 0.07)" },
    },
  },
  plugins: [],
} satisfies Config;
