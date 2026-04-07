import type { Config } from "tailwindcss";
import preset from "@rainmachine/config/tailwind-preset";

const config: Config = {
  presets: [preset as Config],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
};

export default config;
