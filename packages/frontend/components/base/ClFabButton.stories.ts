import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ClFabButton from './ClFabButton.vue'

const meta: Meta<typeof ClFabButton> = {
  title: 'Components/Base/ClFabButton',
  component: ClFabButton,
  args: {
    label: 'データソースを追加',
    size: 'md',
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['md', 'lg'],
    },
  },
}

export default meta

type Story = StoryObj<typeof ClFabButton>

export const Default: Story = {}

export const Large: Story = {
  args: {
    size: 'lg',
  },
}
