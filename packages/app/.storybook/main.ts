import type { StorybookConfig } from '@nuxtjs/storybook'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook-vue/nuxt',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
}
export default config
