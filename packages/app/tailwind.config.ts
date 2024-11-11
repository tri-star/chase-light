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
        "header-icon": colors.slate[200],
        "side-menu": colors.slate[50],
        "side-menu-hover": colors.slate[100],
        "side-menu-active": colors.slate[300],
      },
      textColor: {
        primary: colors.slate[50],
        default: colors.slate[950],
        disabled: colors.slate[500],
        alert: colors.red[600],
        "header-icon": colors.slate[600],
        "side-menu-text": colors.slate[500],
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
    },
  },
})
