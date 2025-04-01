import type { Meta, StoryObj } from '@storybook/vue3'

import A3Frame from './A3Frame.vue'
import { defaultLayoutDecorator } from '~/stories/default-layout-decorator'

const meta = {
  title: 'Components/A3Frame',
  component: A3Frame,
  tags: ['autodocs'],
  decorators: [defaultLayoutDecorator],
} satisfies Meta<typeof A3Frame>

export default meta
type Story = StoryObj<typeof meta>

export const A3FramePlaygroundStory: Story = {
  name: 'Playground',
  args: {
    title: 'タイトル',
    type: 'default',
  },
  argTypes: {
    type: {
      options: ['default', 'alert'],
      control: { type: 'select' },
    },
  },
  render: (args: unknown) => ({
    components: { A3Frame },
    setup() {
      return { args }
    },
    template: '<A3Frame v-bind="args">テストコンテンツ</A3Frame>',
  }),
}
