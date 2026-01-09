/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "dm-serif-text": ["DMSerifText", "sans-serif"],
      },
      // colors: {
      //   // 🎨 Brand / Identity colors
      //   primary: {
      //     light: "", // Highlight or hover version of primary color
      //     DEFAULT: "#FF6200", // Main brand color (used for buttons, links, emphasis)
      //     dark: "", // Used for pressed states or dark mode contrast
      //   },
      //   secondary: {
      //     light: "", // Softer, lighter secondary tone
      //     DEFAULT: "", // Supporting brand color (for accents or highlights)
      //     dark: "", // Deeper version for dark surfaces
      //   },
      //   accent: {
      //     light: "", // Gentle accent for subtle highlights
      //     DEFAULT: "", // Main accent (used for success or action hints)
      //     dark: "", // Darker tone for contrast in dark mode
      //   },

      //   // 🧱 Background layers
      //   background: {
      //     DEFAULT: "#FDFBF5", // App or screen background (light mode)
      //     surface: "", // Cards, modals, and elevated surfaces
      //     muted: "", // Subtle sections or muted panels (light beige)
      //     dark: {
      //       DEFAULT: "", // Global background for dark mode
      //       surface: "", // Card/modal background in dark mode
      //       muted: "", // Muted surface areas in dark mode
      //     },
      //   },

      //   // ✍️ Text colors
      //   text: {
      //     primary: "#4C2300", // Main readable text on light background
      //     secondary: "#000000", // Subheadings or secondary text
      //     tertiary: "#404040",
      //     muted: "", // Disabled or helper text
      //     inverse: "#FFFFFF", // Text on dark backgrounds (buttons, overlays)
      //     dark: {
      //       primary: "", // Main text in dark mode (bright white)
      //       secondary: "", // Slightly dimmed text for dark mode
      //       tertiary: "",
      //       muted: "", // Low-emphasis text on dark background
      //       inverse: "", // Inverted text for light surfaces inside dark mode
      //     },
      //   },

      //   // 🪟 Border colors
      //   border: {
      //     DEFAULT: "", // Dividers, outlines for cards and sections
      //     focus: "", // Border when an element is active or focused
      //     dark: {
      //       DEFAULT: "", // Standard divider in dark mode
      //       focus: "", // Focus/active border in dark mode (secondary accent)
      //     },
      //   },

      //   // ⚠️ Status colors (system feedback)
      //   success: {
      //     light: "", // Success background or light highlight
      //     DEFAULT: "", // Main success color (for confirmations, badges)
      //     dark: "", // Dark success tone for dark mode
      //   },
      //   error: {
      //     light: "", // Light red for warnings
      //     DEFAULT: "", // Primary error color (alerts, validations)
      //     dark: "", // Dark red for dark mode
      //   },
      //   warning: {
      //     light: "", // Soft amber for background or alerts
      //     DEFAULT: "", // Main warning color (toast, alert, notice)
      //     dark: "", // Deep amber for dark mode
      //   },
      //   info: {
      //     light: "", // Light blue for background/info highlights
      //     DEFAULT: "#3B82F6", // Main info color (links, icons, notices)
      //     dark: "", // Deep blue for dark mode
      //   },
      // },
    },
  },
  plugins: [],
};
