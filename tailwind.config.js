module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // New light theme color palette
        primary: "#121212",        // Jet black for primary text and buttons
        secondary: "#1E1E1E",      // Dark charcoal for secondary text
        accent: "#C9C9F7",         // Soft lavender-gray for accents
        background: "#FFFFFF",     // Pure white background
        surface: "#FFFFFF",        // White surface/card background
        border: "#1E1E1E",         // Dark border color
        error: "#D84C3E",          // Industrial red for errors
        warning: "#FF9900",        // Industrial orange for warnings
        
        // Legacy colors for backward compatibility (updated values)
        card: "#FFFFFF",
        bgDark: "#FFFFFF",
      },
      borderColor: {
        'light': 'rgba(30, 30, 30, 0.1)',
        'medium': 'rgba(30, 30, 30, 0.2)',
        'strong': 'rgba(30, 30, 30, 0.3)',
      },
      backgroundColor: {
        'error-light': 'rgba(216, 76, 62, 0.1)',
        'warning-light': 'rgba(255, 153, 0, 0.1)',
        'accent-light': 'rgba(201, 201, 247, 0.1)',
      },
      textColor: {
        'muted': 'rgba(30, 30, 30, 0.6)',
        'disabled': 'rgba(30, 30, 30, 0.4)',
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0, 0, 0, 0.08)",
        card: "0 2px 10px rgba(0, 0, 0, 0.1)",
        focus: "0 0 0 3px rgba(201, 201, 247, 0.3)",
      },
      keyframes: {
        glow: {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "50%": { transform: "translateY(-10px) scale(1.05)" },
        },
        glow2: {
          "0%, 100%": { transform: "translateX(0px) scale(1)" },
          "50%": { transform: "translateX(10px) scale(1.03)" },
        },
      },
      animation: {
        glow: "glow 8s ease-in-out infinite",
        glow2: "glow2 10s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
