import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ClIconButton from './ClIconButton.vue'

const meta: Meta<typeof ClIconButton> = {
  title: 'Components/Base/ClIconButton',
  component: ClIconButton,
  tags: ['autodocs'],
  args: {
    ariaLabel: 'アクション',
    icon: 'i-heroicons-share-20-solid',
    variant: 'ghost',
    size: 'md',
    disabled: false,
  },
  argTypes: {
    ariaLabel: {
      description: '必須のアクセシビリティラベル',
      control: { type: 'text' },
    },
    icon: {
      description: '表示するアイコン（Iconコンポーネントのname）',
      control: { type: 'text' },
    },
    variant: {
      description: 'スタイル: ghost / solid',
      control: { type: 'select' },
      options: ['ghost', 'solid'],
    },
    size: {
      description: 'サイズ: sm / md / lg',
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      description: '無効状態（クリック不可）',
      control: { type: 'boolean' },
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
ClIconButtonはアイコンのみの操作に最適化したベースボタンです。

## 特徴
- バリアント: ghost / solid
- サイズ: sm / md / lg
- アクセシビリティ: aria-label必須、focus-visibleリング
- disabled時はクリック不可・スタイル反映

## 使用例
\`\`\`vue
<ClIconButton aria-label="共有" icon="i-heroicons-share-20-solid" />
<ClIconButton aria-label="保存" icon="i-heroicons-bookmark-20-solid" variant="solid" />
\`\`\`
        `,
      },
    },
  },
  render: (args) => ({
    components: { ClIconButton },
    setup: () => ({ args }),
    template: `
      <ClIconButton v-bind="args" />
    `,
  }),
}

export default meta

type Story = StoryObj<typeof ClIconButton>

export const Default: Story = {}

export const Solid: Story = {
  args: {
    variant: 'solid',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const Sizes: Story = {
  render: () => ({
    components: { ClIconButton },
    template: `
      <div class="flex items-center gap-3">
        <ClIconButton aria-label="small" icon="i-heroicons-share-20-solid" size="sm" />
        <ClIconButton aria-label="medium" icon="i-heroicons-share-20-solid" size="md" />
        <ClIconButton aria-label="large" icon="i-heroicons-share-20-solid" size="lg" />
      </div>
    `,
  }),
}

export const Variants: Story = {
  render: () => ({
    components: { ClIconButton },
    template: `
      <div class="flex items-center gap-3">
        <ClIconButton aria-label="ghost" icon="i-heroicons-heart-20-solid" variant="ghost" />
        <ClIconButton aria-label="solid" icon="i-heroicons-heart-20-solid" variant="solid" />
      </div>
    `,
  }),
}
