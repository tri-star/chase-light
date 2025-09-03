import type { StoryObj, Meta } from '@nuxtjs/storybook'
import ClThemeSelector from './ClThemeSelector.vue'

const meta: Meta<typeof ClThemeSelector> = {
  title: 'Components/Base/ClThemeSelector',
  component: ClThemeSelector,
  parameters: {
    docs: {
      description: {
        component:
          'テーマ切り替えボタンコンポーネントです。ライトモードとダークモードを切り替えることができ、現在のテーマに応じてアイコンと色が変化します。',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'ボタンのサイズ',
      defaultValue: 'md',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    size: 'md',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
  },
}

export const SizeComparison: Story = {
  render: () => ({
    components: { ClThemeSelector },
    template: `
      <div class="space-y-6">
        <div class="p-4 border rounded-lg">
          <h3 class="mb-4 text-lg font-medium text-content-default">サイズ比較</h3>
          <div class="flex items-center gap-4">
            <div class="text-center">
              <div class="mb-2">
                <ClThemeSelector size="sm" />
              </div>
              <p class="text-sm text-content-default opacity-75">Small (sm)</p>
            </div>
            <div class="text-center">
              <div class="mb-2">
                <ClThemeSelector size="md" />
              </div>
              <p class="text-sm text-content-default opacity-75">Medium (md)</p>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
}

export const ThemeToggleDemo: Story = {
  render: () => ({
    components: { ClThemeSelector },
    setup() {
      const currentTheme = ref('light')

      // テーマ変更をシミュレート（実際のテーマ切り替えではなく表示のみ）
      const demoTheme = ref<'light' | 'dark'>('light')

      const toggleDemo = () => {
        demoTheme.value = demoTheme.value === 'light' ? 'dark' : 'light'
      }

      return {
        currentTheme,
        demoTheme,
        toggleDemo,
      }
    },
    template: `
      <div class="space-y-6">
        <div class="p-4 border rounded-lg">
          <h3 class="mb-4 text-lg font-medium text-content-default">テーマ切り替えデモ</h3>
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <ClThemeSelector />
              <p class="text-sm text-content-default">
                実際のテーマ切り替えボタン（クリックしてテーマを変更）
              </p>
            </div>
            
            <div class="pt-4 border-t">
              <p class="text-xs text-content-default opacity-75">
                注意: Storybookでは実際のテーマ切り替えが制限される場合があります。<br>
                本番環境では正常にライト/ダークモードが切り替わります。
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
}

export const InHeader: Story = {
  render: () => ({
    components: { ClThemeSelector },
    template: `
      <div class="space-y-6">
        <div class="p-4 border rounded-lg">
          <h3 class="mb-4 text-lg font-medium text-content-default">ヘッダー内での使用例</h3>
          <div class="bg-header-default border-b border-header-default px-4 py-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <h1 class="text-lg font-semibold text-header-default">Chase Light</h1>
              </div>
              <div class="flex items-center gap-3">
                <ClThemeSelector size="sm" />
                <div class="w-8 h-8 bg-surface-primary-default rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
}
