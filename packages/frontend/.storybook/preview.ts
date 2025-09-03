import type { Preview } from '@nuxtjs/storybook'
import { initialize, mswLoader } from 'msw-storybook-addon'

// MSW初期化
initialize()

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    msw: {
      handlers: [],
    },
  },
  loaders: [mswLoader],
}

export default preview
