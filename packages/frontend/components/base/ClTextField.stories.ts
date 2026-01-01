import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ClTextField from './ClTextField.vue'

const meta: Meta<typeof ClTextField> = {
  title: 'Components/Base/ClTextField',
  component: ClTextField,
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: 'text',
      description: '入力値（v-model）',
    },
    placeholder: {
      control: 'text',
      description: 'プレースホルダーテキスト',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
    ariaLabel: {
      control: 'text',
      description: 'アリアラベル（スクリーンリーダー用）',
    },
    type: {
      control: 'select',
      options: ['text', 'search', 'email', 'password'],
      description: '入力タイプ',
    },
  },
  args: {
    modelValue: '',
    placeholder: 'テキストを入力...',
    disabled: false,
    type: 'text',
  },
} satisfies Meta<typeof ClTextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithValue: Story = {
  args: {
    modelValue: 'サンプルテキスト',
  },
}

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'キーワードで検索...',
  },
}

export const Disabled: Story = {
  args: {
    modelValue: 'この入力は無効です',
    disabled: true,
  },
}

export const TypeSearch: Story = {
  args: {
    type: 'search',
    placeholder: '検索...',
  },
}

export const TypeEmail: Story = {
  args: {
    type: 'email',
    placeholder: 'メールアドレスを入力...',
  },
}

export const TypePassword: Story = {
  args: {
    type: 'password',
    placeholder: 'パスワードを入力...',
  },
}

export const WithPrefix: Story = {
  render: (args: Record<string, unknown>) => ({
    components: { ClTextField },
    setup() {
      return { args }
    },
    template: `
      <ClTextField v-bind="args">
        <template #prefix>
          <Icon name="heroicons:magnifying-glass" size="20" aria-hidden="true" />
        </template>
      </ClTextField>
    `,
  }),
  args: {
    placeholder: '検索...',
  },
}

export const WithSuffix: Story = {
  render: (args: Record<string, unknown>) => ({
    components: { ClTextField },
    setup() {
      return { args }
    },
    template: `
      <ClTextField v-bind="args">
        <template #suffix>
          <button type="button" class="hover:text-card-value">
            <Icon name="heroicons:x-mark" size="20" aria-hidden="true" />
          </button>
        </template>
      </ClTextField>
    `,
  }),
  args: {
    modelValue: 'サンプルテキスト',
    placeholder: '検索...',
  },
}
