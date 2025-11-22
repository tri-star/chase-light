import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ClSpinner from './ClSpinner.vue'

const meta: Meta<typeof ClSpinner> = {
  title: 'Components/Base/ClSpinner',
  component: ClSpinner,
  args: {
    size: 'md',
    variant: 'primary',
    ariaLabel: '読み込み中',
    srText: '読み込み中',
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg'],
    },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'muted'],
    },
  },
}

export default meta

type Story = StoryObj<typeof ClSpinner>

export const Default: Story = {}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
}

export const Muted: Story = {
  args: {
    variant: 'muted',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
  },
}
