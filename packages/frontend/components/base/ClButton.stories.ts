import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ClButton from './ClButton.vue'

const meta: Meta<typeof ClButton> = {
  title: 'Components/Base/ClButton',
  component: ClButton,
  tags: ['autodocs'],
  args: {
    intent: 'primary',
    size: 'md',
    block: false,
    loading: false,
    disabled: false,
    type: 'button',
  },
  argTypes: {
    intent: {
      description: 'バリアント: default / primary / secondary / outline',
      control: { type: 'select' },
      options: ['default', 'primary', 'secondary', 'outline'],
    },
    size: {
      description: 'サイズ: sm / md / lg',
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    block: {
      description: '幅いっぱいに広げる',
      control: { type: 'boolean' },
    },
    loading: {
      description: 'ローディング状態（クリック不可、スピナー表示）',
      control: { type: 'boolean' },
    },
    disabled: {
      description: '無効状態（クリック不可、スタイル変更）',
      control: { type: 'boolean' },
    },
    type: {
      description: 'button / submit / reset',
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
    },
    ariaLabel: {
      description: 'アクセシビリティラベル（ボタンにテキストがない場合に指定）',
      control: { type: 'text' },
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
ClButtonはデザイントークン（surface/interactive/focus）に基づいたベースボタンです。

## 特徴
- バリアント: default / primary / secondary / outline
- サイズ: sm / md / lg
- 状態: disabled, loading（内部で ClSpinner を表示）
- block表示・prefix/suffixスロット対応
- アクセシビリティ: aria-busy/aria-label, focus-visibleリング

## 使用例
\`\`\`vue
<ClButton intent="primary" size="md">保存</ClButton>
<ClButton intent="outline" :disabled="true">無効</ClButton>
<ClButton intent="secondary" :loading="true">処理中</ClButton>
<ClButton block>幅いっぱい</ClButton>
\`\`\`
        `,
      },
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

export const Sizes: Story = {
  render: () => ({
    components: { ClButton },
    template: `
      <div class="flex flex-wrap gap-3 items-center">
        <ClButton size="sm" intent="primary">Small</ClButton>
        <ClButton size="md" intent="primary">Medium</ClButton>
        <ClButton size="lg" intent="primary">Large</ClButton>
      </div>
    `,
  }),
}

export const Variants: Story = {
  render: () => ({
    components: { ClButton },
    template: `
      <div class="flex flex-wrap gap-3">
        <ClButton intent="default">Default</ClButton>
        <ClButton intent="primary">Primary</ClButton>
        <ClButton intent="secondary">Secondary</ClButton>
        <ClButton intent="outline">Outline</ClButton>
      </div>
    `,
  }),
}

export const DisabledStates: Story = {
  render: () => ({
    components: { ClButton },
    template: `
      <div class="space-y-3">
        <div class="text-sm font-medium">バリアント別 disabled</div>
        <div class="flex flex-wrap gap-3">
          <ClButton intent="default" :disabled="true">Default / Disabled</ClButton>
          <ClButton intent="primary" :disabled="true">Primary / Disabled</ClButton>
          <ClButton intent="secondary" :disabled="true">Secondary / Disabled</ClButton>
          <ClButton intent="outline" :disabled="true">Outline / Disabled</ClButton>
        </div>
        <div class="text-sm font-medium pt-2">loading + disabled相当</div>
        <div class="flex flex-wrap gap-3">
          <ClButton intent="primary" :loading="true">処理中</ClButton>
          <ClButton intent="secondary" :loading="true">処理中</ClButton>
          <ClButton intent="outline" :loading="true">処理中</ClButton>
        </div>
      </div>
    `,
  }),
}

export const WithSlots: Story = {
  render: () => ({
    components: { ClButton },
    template: `
      <div class="flex flex-wrap gap-3 items-center">
        <ClButton intent="primary">
          <template #prefix>⬅</template>
          戻る
        </ClButton>
        <ClButton intent="secondary">
          次へ
          <template #suffix>➡</template>
        </ClButton>
      </div>
    `,
  }),
}
