import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ClButton from './ClButton.vue'

const meta: Meta<typeof ClButton> = {
  title: 'Components/Base/ClButton',
  component: ClButton,
  args: {
    intent: 'primary',
    size: 'md',
    block: false,
    loading: false,
    disabled: false,
    type: 'button',
    ariaLabel: 'ボタン',
  },
  argTypes: {
    intent: {
      control: { type: 'select' },
      options: ['default', 'primary', 'secondary', 'outline'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    block: {
      control: { type: 'boolean' },
    },
    loading: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
    },
  },
  render: (args) => ({
    components: { ClButton },
    setup: () => ({ args }),
    template: `
      <ClButton v-bind="args">
        {{ args.intent }} ボタン
      </ClButton>
    `,
  }),
}

export default meta

type Story = StoryObj<typeof ClButton>

export const Default: Story = {}

export const Secondary: Story = {
  args: {
    intent: 'secondary',
  },
}

export const Outline: Story = {
  args: {
    intent: 'outline',
  },
}

export const Loading: Story = {
  args: {
    loading: true,
  },
}

export const Block: Story = {
  args: {
    block: true,
  },
}
