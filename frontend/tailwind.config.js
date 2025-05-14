import scrollbar from "tailwind-scrollbar";

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // Ensure all your files are included
  theme: {
    extend: {
      fontSize: {
        sm: "10pt", // Small font size
        base: "14pt", // Base font size
        lg: "18pt", // Large font size
      },
    },
  },
  safelist: ["text-sm", "text-base", "text-lg"],
  plugins: [scrollbar],
};