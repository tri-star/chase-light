import type { Config } from "tailwindcss"
import colors from "tailwindcss/colors"

export default (<Partial<Config>>{
  theme: {
    extend: {
      backgroundColor: {
        primary: colors.cyan[500],
        "primary-hover": colors.cyan[400],
        default: colors.slate[50],
        "default-button": colors.slate[200],
        "default-button-hover": colors.slate[100],
        "default-input": colors.white,
        disabled: colors.slate[300],
        alert: colors.red[100],
        header: "rgba(255, 255, 255, 0.7)",
        "header-icon": colors.slate[300],
        "header-icon-hover": colors.slate[200],
        "side-menu": colors.cyan[950],
        "side-menu-hover": "rgba(255, 255, 255, 0.2)",
        "side-menu-active": "rgba(255, 255, 255, 0.35)",
      },
      textColor: {
        primary: colors.slate[50],
        default: colors.slate[950],
        disabled: colors.slate[500],
        alert: colors.red[600],
        "header-icon": colors.slate[700],
        "header-icon-hover": colors.slate[600],
        "side-menu-text": colors.slate[300],
        "side-menu-text-hover": colors.slate[400],
        "side-menu-text-active": colors.slate[200],
      },
      borderColor: {
        primary: colors.cyan[500],
        "primary-hover": colors.cyan[400],
        default: colors.slate[400],
        "default-button": colors.slate[400],
        "default-button-hover": colors.slate[100],
        "default-input": colors.slate[400],
        disabled: colors.slate[300],
        alert: colors.red[800],
      },
      fontFamily: {
        sans: ["Noto Sans JP", "sans-serif"],
        label: ["Noto Sans JP", "sans-serif"],
      },
      fontSize: {
        "size-m": "16px",
        "size-l": "16px",
      },
    },
  },
})
