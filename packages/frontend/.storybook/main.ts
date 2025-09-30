import type { StorybookConfig } from '@storybook-vue/nuxt'

const config: StorybookConfig = {
  stories: [
    '../components/**/*.mdx',
    '../components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: ['@storybook/addon-docs', 'msw-storybook-addon'],
  framework: {
    name: '@storybook-vue/nuxt',
    options: {},
  },
  staticDirs: ['./public'],
}
export default config
