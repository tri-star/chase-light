import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

export default (<Partial<Config>>{
  content: [
    './src/**/*.vue', // コンポーネントのパスを指定
  ],
  theme: {
    extend: {
      backgroundColor: {
        primary: colors.cyan[500],
        'primary-hover': colors.cyan[400],
        default: colors.slate[50],
        'default-button': colors.slate[200],
        'default-button-hover': colors.slate[100],
        'default-input': colors.white,
        'default-input-hover': colors.cyan[50],
        disabled: colors.slate[300],
        alert: colors.red[100],
        header: 'rgba(255, 255, 255, 0.7)',
        'header-icon': colors.slate[300],
        'header-icon-hover': colors.slate[200],
        'side-menu': colors.cyan[950],
        'side-menu-hover': 'rgba(255, 255, 255, 0.2)',
        'side-menu-active': 'rgba(255, 255, 255, 0.35)',
        'side-menu-backdrop': 'rgba(0, 0, 0, 0.5)',
        success: colors.lime[200],
        'menu-item': 'hsl(0deg, 0%, 100%, 60%)',
        'menu-item-hover': 'hsl(189deg 94% 43% / 10%)',
        list: colors.white,
        muted: colors.slate[300],
        card: colors.white,
      },
      textColor: {
        primary: colors.slate[50],
        default: colors.slate[950],
        disabled: colors.slate[500],
        alert: colors.red[600],
        'header-icon': colors.slate[700],
        'header-icon-hover': colors.slate[600],
        'side-menu-text': colors.slate[300],
        'side-menu-text-hover': colors.slate[400],
        'side-menu-text-active': colors.slate[200],
        success: colors.lime[700],
        muted: colors.slate[500],
      },
      borderColor: {
        primary: colors.cyan[500],
        'primary-button': colors.cyan[600],
        'primary-hover': colors.cyan[400],
        default: colors.slate[400],
        'default-button': colors.slate[500],
        'default-button-hover': colors.slate[100],
        'default-input': colors.slate[400],
        disabled: colors.slate[300],
        alert: colors.red[800],
        success: colors.lime[400],
        menu: 'hsl(0deg, 0%, 80%, 60%)',
        list: colors.slate[300],
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
        label: ['Noto Sans JP', 'sans-serif'],
        heading: ['Noto Sans JP', 'sans-serif'],
      },
      fontSize: {
        'size-m': '16px',
        'size-l': '16px',
        'size-h1': '36px',
        'size-h2': '32px',
        'size-h3': '28px',
        'size-h4': '24px',
        'size-h5': '20px',
      },
      zIndex: {
        header: '140',
        'side-menu': '150',
        'side-menu-backdrop': '100',
      },
    },
  },
})
