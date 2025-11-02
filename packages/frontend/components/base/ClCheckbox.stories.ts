import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { ref } from 'vue'
import ClCheckbox from './ClCheckbox.vue'

const meta: Meta<typeof ClCheckbox> = {
  title: 'Base/ClCheckbox',
  component: ClCheckbox,
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      description:
        'v-model用の値。単一の場合はboolean、グループの場合はstring[]またはnumber[]',
      control: { type: 'boolean' },
    },
    value: {
      description: 'チェックボックスの値（グループ使用時に必須）',
      control: { type: 'text' },
    },
    indeterminate: {
      description: 'インデターミネート状態（一部選択状態）',
      control: { type: 'boolean' },
    },
    disabled: {
      description: '無効化状態',
      control: { type: 'boolean' },
    },
    label: {
      description: 'ラベルテキスト',
      control: { type: 'text' },
    },
    id: {
      description: 'HTML id属性',
      control: { type: 'text' },
    },
    name: {
      description: 'HTML name属性（グループで共通化）',
      control: { type: 'text' },
    },
    ariaLabel: {
      description: 'アクセシビリティラベル',
      control: { type: 'text' },
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
ClCheckboxコンポーネントは、デザイントークンに準拠したカスタムチェックボックスUIを提供します。

## 特徴

- v-modelによる単一値（boolean）と配列値（string[]、number[]）の制御に対応
- インデターミネート状態（一部選択状態）のサポート
- アクセシビリティとキーボード操作に対応
- Tailwind CSSを活用した状態別スタイル（hover、focus、disabled）
- アニメーション付きのチェック状態切り替え

## 使用例

### 単一のチェックボックス

\`\`\`vue
<script setup>
const isChecked = ref(false)
</script>

<template>
  <ClCheckbox v-model="isChecked" label="利用規約に同意する" />
</template>
\`\`\`

### グループ制御（配列値）

\`\`\`vue
<script setup>
const selectedFruits = ref(['apple'])
</script>

<template>
  <ClCheckbox v-model="selectedFruits" value="apple" label="りんご" />
  <ClCheckbox v-model="selectedFruits" value="banana" label="バナナ" />
  <ClCheckbox v-model="selectedFruits" value="orange" label="オレンジ" />
</template>
\`\`\`

### インデターミネート状態

\`\`\`vue
<script setup>
const isIndeterminate = ref(true)
const isChecked = ref(false)
</script>

<template>
  <ClCheckbox
    v-model="isChecked"
    :indeterminate="isIndeterminate"
    label="全て選択"
  />
</template>
\`\`\`
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ClCheckbox>

// Default: 未チェック状態
export const Default: Story = {
  args: {
    label: 'チェックボックス',
  },
}

// Checked: チェック状態
export const Checked: Story = {
  args: {
    modelValue: true,
    label: 'チェック済み',
  },
}

// Indeterminate: インデターミネート状態
export const Indeterminate: Story = {
  args: {
    modelValue: false,
    indeterminate: true,
    label: 'インデターミネート（一部選択）',
  },
}

// Disabled: 無効化状態
export const Disabled: Story = {
  args: {
    disabled: true,
    label: '無効化されたチェックボックス',
  },
}

// DisabledChecked: 無効化＋チェック状態
export const DisabledChecked: Story = {
  args: {
    modelValue: true,
    disabled: true,
    label: '無効化されたチェックボックス（チェック済み）',
  },
}

// WithoutLabel: ラベルなし
export const WithoutLabel: Story = {
  args: {
    ariaLabel: 'チェックボックス（ラベルなし）',
  },
}

// Group: グループ制御（配列値）
export const Group: Story = {
  render: () => ({
    components: { ClCheckbox },
    setup() {
      const selectedFruits = ref<string[]>(['apple'])

      return { selectedFruits }
    },
    template: `
      <div class="space-y-3">
        <div class="font-medium text-sm">選択されたフルーツ: {{ selectedFruits.join(', ') || 'なし' }}</div>
        <ClCheckbox v-model="selectedFruits" value="apple" label="りんご" />
        <ClCheckbox v-model="selectedFruits" value="banana" label="バナナ" />
        <ClCheckbox v-model="selectedFruits" value="orange" label="オレンジ" />
        <ClCheckbox v-model="selectedFruits" value="grape" label="ぶどう" />
      </div>
    `,
  }),
}

// Interactive: インタラクティブな操作確認用
export const Interactive: Story = {
  render: () => ({
    components: { ClCheckbox },
    setup() {
      const isChecked = ref(false)
      const isIndeterminate = ref(false)
      const isDisabled = ref(false)

      const toggleIndeterminate = () => {
        isIndeterminate.value = !isIndeterminate.value
        if (isIndeterminate.value) {
          isChecked.value = false
        }
      }

      return {
        isChecked,
        isIndeterminate,
        isDisabled,
        toggleIndeterminate,
      }
    },
    template: `
      <div class="space-y-4">
        <div class="space-y-2">
          <ClCheckbox
            v-model="isChecked"
            :indeterminate="isIndeterminate"
            :disabled="isDisabled"
            label="メインチェックボックス"
          />
        </div>

        <div class="border-t pt-4 space-y-2">
          <div class="font-medium text-sm">コントロール</div>
          <div class="flex gap-4">
            <button
              @click="toggleIndeterminate"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {{ isIndeterminate ? 'インデターミネート解除' : 'インデターミネート設定' }}
            </button>
            <button
              @click="isDisabled = !isDisabled"
              class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {{ isDisabled ? '有効化' : '無効化' }}
            </button>
          </div>
        </div>

        <div class="border-t pt-4 space-y-1 text-sm">
          <div class="font-medium">状態</div>
          <div>チェック: {{ isChecked ? 'ON' : 'OFF' }}</div>
          <div>インデターミネート: {{ isIndeterminate ? 'ON' : 'OFF' }}</div>
          <div>無効化: {{ isDisabled ? 'ON' : 'OFF' }}</div>
        </div>
      </div>
    `,
  }),
}

// AllStates: 全ての状態を一覧表示
export const AllStates: Story = {
  render: () => ({
    components: { ClCheckbox },
    template: `
      <div class="space-y-6">
        <div>
          <div class="font-medium text-sm mb-2">未チェック</div>
          <ClCheckbox :modelValue="false" label="未チェック" />
        </div>

        <div>
          <div class="font-medium text-sm mb-2">チェック済み</div>
          <ClCheckbox :modelValue="true" label="チェック済み" />
        </div>

        <div>
          <div class="font-medium text-sm mb-2">インデターミネート</div>
          <ClCheckbox :modelValue="false" :indeterminate="true" label="インデターミネート" />
        </div>

        <div>
          <div class="font-medium text-sm mb-2">無効化（未チェック）</div>
          <ClCheckbox :modelValue="false" :disabled="true" label="無効化（未チェック）" />
        </div>

        <div>
          <div class="font-medium text-sm mb-2">無効化（チェック済み）</div>
          <ClCheckbox :modelValue="true" :disabled="true" label="無効化（チェック済み）" />
        </div>

        <div>
          <div class="font-medium text-sm mb-2">無効化（インデターミネート）</div>
          <ClCheckbox
            :modelValue="false"
            :indeterminate="true"
            :disabled="true"
            label="無効化（インデターミネート）"
          />
        </div>
      </div>
    `,
  }),
}
