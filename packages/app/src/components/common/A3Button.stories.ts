import type { Meta, StoryObj } from '@storybook/vue3'

import A3Button from './A3Button.vue'
import { defaultLayoutDecorator } from '~/stories/default-layout-decorator'

const meta = {
  title: 'Components/A3Button',
  component: A3Button,
  tags: ['autodocs'],
  decorators: [defaultLayoutDecorator],
} satisfies Meta<typeof A3Button>

export default meta
type Story = StoryObj<typeof meta>

const buttonType: 'default' | 'primary' = 'primary'

export const A3DropDownPlaygroundStory: Story = {
  name: 'Playground',
  args: {
    label: 'ボタン',
    loading: false,
    disabled: false,
    type: buttonType,
  },
  argTypes: {
    type: {
      options: ['default', 'primary'],
      control: { type: 'select' },
    },
  },
  render: (args) => ({
    components: { A3Button },
    setup() {
      return { args }
    },
    template: '<A3Button v-bind="args" />',
  }),
}
