import type { Config } from "tailwindcss";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        background: "#050D1A",
        surface: "#0A1628",
        "surface-hover": "#0F1E35",
        border: "#1A2A42",
        "border-hover": "#2A3F60",
        cyan: {
          DEFAULT: "#00D4FF",
          dim: "#0099BB",
          glow: "rgba(0, 212, 255, 0.15)",
        },
        orange: {
          DEFAULT: "#FF6B35",
          dim: "#CC4A1A",
          glow: "rgba(255, 107, 53, 0.15)",
        },
        green: {
          DEFAULT: "#00FF88",
          dim: "#00BB55",
          glow: "rgba(0, 255, 136, 0.15)",
        },
        red: {
          DEFAULT: "#FF3B3B",
          dim: "#CC1A1A",
        },
        text: {
          DEFAULT: "#E8F4FF",
          muted: "#8BA3BF",
          dim: "#4A6A8A",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        mono: ["Share Tech Mono", "monospace"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        "cyan-glow": "0 0 20px rgba(0, 212, 255, 0.3)",
        "cyan-glow-sm": "0 0 10px rgba(0, 212, 255, 0.2)",
        "orange-glow": "0 0 20px rgba(255, 107, 53, 0.3)",
        "green-glow": "0 0 20px rgba(0, 255, 136, 0.3)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
};

export default preset;
