import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { DesignTokenHelper } from './design-token-helper'

const meta: Meta = {
  title: 'Design System/Sizing',
  parameters: {
    docs: {
      description: {
        component:
          '幅・高さに利用するサイジングスケール。サンプル矩形と想定Tailwindクラスを表示します。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const SizingList = {
  template: `
    <section>
      <h2 class="text-2xl font-bold mb-4">Size Scale</h2>
      <div class="grid grid-cols-1 gap-6">
        <div v-for="item in sizes" :key="item.name" class="space-y-2">
          <div class="w-full h-4 rounded bg-[oklch(87.585%_0.0123_247.97_/_.25)]">
            <div
              :style="{
                height: '100%',
                background: 'var(--color-primitive-blue-500)',
                width: gaugeWidth(item),
                borderRadius: '4px',
              }"
            />
          </div>
          <div class="text-sm">{{ item.name }}</div>
          <div class="text-xs space-y-1">
            <div><strong>CSS Var:</strong> <span :style="mono">{{ item.cssVar }}</span></div>
            <div><strong>Value:</strong> <span :style="mono">{{ item.value }}</span></div>
            <div>
              <strong>Classes:</strong>
              <span :style="mono" @click="selectText($event)">w-{{ item.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const sizes = DesignTokenHelper.getSizeScale()

    const selectText = (event: Event) => {
      const target = event.target as HTMLElement
      if (!target) return
      const range = document.createRange()
      range.selectNodeContents(target)
      const sel = window.getSelection()
      if (!sel) return
      sel.removeAllRanges()
      sel.addRange(range)
    }

    const mono = {
      fontFamily: 'monospace',
      cursor: 'pointer',
      padding: '1px 3px',
      borderRadius: '2px',
      backgroundColor: 'var(--color-primitive-gray-100)',
    }

    const gaugeWidth = (item: { value: string }) => {
      const v = String(item.value).trim()
      if (v === '0') return '0px'
      // percentages and keywords
      if (v.endsWith('%')) return v
      if (v === 'auto') return 'auto'
      // absolute units
      return v
    }

    return { sizes, selectText, mono, gaugeWidth }
  },
}

export const Sizing: Story = {
  render: () => ({
    components: { SizingList },
    template: `<SizingList />`,
  }),
}
