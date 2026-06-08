import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        lgred: "#A50034",
        lgdark: "#6B0036",
        mint: "#A50034",
        cloud: "#f7f8fb",
      },
      boxShadow: {
        phone: "0 24px 60px rgba(17, 24, 39, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
