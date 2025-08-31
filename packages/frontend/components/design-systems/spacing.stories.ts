import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { DesignTokenHelper } from './design-token-helper'
import { mono, selectText } from './parts/story-utils'

const meta: Meta = {
  title: 'Design System/Spacing',
  parameters: {
    docs: {
      description: {
        component:
          'マージン/パディング/ギャップ用のスペーシングスケール。値と想定Tailwindクラス名を併記します。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const SpacingList = {
  template: `
    <section>
      <h2 class="text-2xl font-bold mb-4">Spacing Scale</h2>
      <div class="grid grid-cols-1 gap-4">
        <div v-for="item in spacings" :key="item.name" class="space-y-2">
          <div class="flex items-center gap-3">
            <div class="h-4 rounded bg-[oklch(87.585%_0.0123_247.97_/_.25)]" :style="{ width: trackWidth }">
              <div
                :style="{
                  height: '100%',
                  background: 'var(--color-primitive-blue-500)',
                  width: barWidth(item),
                  borderRadius: '4px',
                }"
              />
            </div>
            <div class="text-sm w-20">{{ item.name }}</div>
          </div>
          <div class="text-xs space-y-1">
            <div><strong>CSS Var:</strong> <span :style="mono">{{ item.cssVar }}</span></div>
            <div><strong>Value:</strong> <span :style="mono">{{ item.value }}</span></div>
            <div>
              <strong>Classes:</strong>
              <span :style="mono" @click="selectText($event)">p-{{ item.name }}</span>
              <span :style="mono" @click="selectText($event)" class="ml-2">m-{{ item.name }}</span>
              <span :style="mono" @click="selectText($event)" class="ml-2">gap-{{ item.name }}</span>
            </div>
          </div>
          <div class="h-px bg-[oklch(87.585%_0.0123_247.97_/_.35)] my-2"></div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const spacings = DesignTokenHelper.getSpacingScale()

    const barWidth = (item: { value: string }) => {
      const v = String(item.value).trim()
      if (v === '0') return '0px'
      // Use token value directly and clamp to track width (24rem)
      return 'min(' + v + ', 24rem)'
    }

    const trackWidth = '24rem' // spacing-96 = 24rem が収まる幅

    return { spacings, selectText, mono, barWidth, trackWidth }
  },
}

export const Spacing: Story = {
  render: () => ({
    components: { SpacingList },
    template: `<SpacingList />`,
  }),
}
