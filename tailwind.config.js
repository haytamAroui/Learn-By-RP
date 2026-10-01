/**
 * NativeWind 4 + Tailwind CSS 3.
 *
 * The colour map is generated from src/design/tokens.ts (see
 * scripts/generate-css.mts) rather than written here. Three hand-maintained
 * copies of one palette is how the previous theme ended up with a stylesheet,
 * a config, and a runtime that all disagreed.
 */
const { colors } = require('./src/design/tailwind-colors.generated.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.js', './App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Class-based so the theme provider can set `dark` on a wrapper View on native,
  // where the class does not land on a document element.
  darkMode: 'class',
  theme: {
    extend: {
      colors,
      fontFamily: {
        // Platform UI font. The display face is editorial and never used for
        // dense UI or target-language conversation.
        sans: ['System', 'system-ui', 'sans-serif'],
        display: ['System', 'system-ui', 'sans-serif'],
        serif: ['serif'],
        mono: ['monospace'],
      },
    },
  },
  plugins: [],
};