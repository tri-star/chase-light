import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ClFabButton from './ClFabButton.vue'

const meta: Meta<typeof ClFabButton> = {
  title: 'Components/Base/ClFabButton',
  component: ClFabButton,
  args: {
    label: 'データソースを追加',
    size: 'md',
    alignX: 'right',
    alignY: 'bottom',
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['md', 'lg'],
    },
    alignX: {
      control: { type: 'select' },
      options: ['left', 'right'],
      description: '横方向の配置',
    },
    alignY: {
      control: { type: 'select' },
      options: ['top', 'bottom'],
      description: '縦方向の配置',
    },
    offsetX: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'X方向のオフセット（sm: 4, md: 6, lg: 10）',
    },
    offsetY: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Y方向のオフセット（sm: 4, md: 6, lg: 10）',
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

export const BottomLeft: Story = {
  args: {
    alignX: 'left',
    alignY: 'bottom',
  },
}

export const TopRight: Story = {
  args: {
    alignX: 'right',
    alignY: 'top',
  },
}

export const TopLeft: Story = {
  args: {
    alignX: 'left',
    alignY: 'top',
  },
}

export const OffsetSmall: Story = {
  args: {
    alignX: 'right',
    alignY: 'bottom',
    offsetX: 'sm',
    offsetY: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'offsetX/offsetYに"sm"を指定（4 = 1rem）',
      },
    },
  },
}

export const OffsetMedium: Story = {
  args: {
    alignX: 'right',
    alignY: 'bottom',
    offsetX: 'md',
    offsetY: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'offsetX/offsetYに"md"を指定（6 = 1.5rem）',
      },
    },
  },
}

export const OffsetLarge: Story = {
  args: {
    alignX: 'right',
    alignY: 'bottom',
    offsetX: 'lg',
    offsetY: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'offsetX/offsetYに"lg"を指定（10 = 2.5rem）',
      },
    },
  },
}
