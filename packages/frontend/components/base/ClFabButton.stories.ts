import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ClFabButton from './ClFabButton.vue'

const meta: Meta<typeof ClFabButton> = {
  title: 'Components/Base/ClFabButton',
  component: ClFabButton,
  args: {
    label: 'データソースを追加',
    size: 'md',
    position: 'bottom-right',
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['md', 'lg'],
    },
    position: {
      control: { type: 'select' },
      options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
    },
    offsetX: {
      control: { type: 'number' },
      description: 'X方向のオフセット（rem単位）',
    },
    offsetY: {
      control: { type: 'number' },
      description: 'Y方向のオフセット（rem単位）',
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
    position: 'bottom-left',
  },
}

export const TopRight: Story = {
  args: {
    position: 'top-right',
  },
}

export const TopLeft: Story = {
  args: {
    position: 'top-left',
  },
}

export const CustomOffset: Story = {
  args: {
    position: 'bottom-right',
    offsetX: 2,
    offsetY: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          'offsetX/offsetYを指定することで、デフォルトのレスポンシブオフセットを上書きできます',
      },
    },
  },
}
