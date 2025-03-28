import type { Meta, StoryObj } from '@storybook/vue3'

import ColorPalette from './ColorPalette.vue'
import { defaultLayoutDecorator } from '~/stories/default-layout-decorator'

const meta = {
  title: 'デザインシステム',
  component: ColorPalette,
  tags: ['autodocs'],
  decorators: [defaultLayoutDecorator],
} satisfies Meta<typeof ColorPalette>

export default meta
type Story = StoryObj<typeof meta>

export const ColorPaletteStory: Story = {
  name: 'カラーパレット',
  render: (args: unknown) => ({
    components: { ColorPalette },
    setup() {
      return { args }
    },
    template: '<ColorPalette />',
  }),
}
