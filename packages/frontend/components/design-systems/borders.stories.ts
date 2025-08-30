import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { DesignTokenHelper } from './design-token-helper'
import { mono, selectText } from './parts/story-utils'

const meta: Meta = {
  title: 'Design System/Borders',
  parameters: {
    docs: {
      description: {
        component:
          'ボーダー幅・スタイル・角丸のプレビュー。CSS変数と想定Tailwindクラス名を併記します。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const BorderShowcase = {
  template: `
    <section>
      <h2 class="text-2xl font-bold mb-4">Border Width</h2>
      <div class="grid grid-cols-1 gap-4 mb-10">
        <div v-for="w in widths" :key="w.name" class="space-y-2">
          <div class="w-full" :style="{ borderTop: widthBorder(w) }"></div>
          <div class="text-xs space-y-1">
            <div><strong>CSS Var:</strong> <span :style="mono">{{ w.cssVar }} ({{ w.value }})</span></div>
            <div><strong>Class:</strong> <span class="cursor-pointer" :style="mono" @click="selectText($event)">border-{{ w.name }}</span></div>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold mb-4">Border Style</h2>
      <div class="grid grid-cols-1 gap-4 mb-10">
        <div v-for="s in styles" :key="s.name" class="space-y-2">
          <div class="w-full" :style="{ borderTop: styleBorder(s) }"></div>
          <div class="text-xs space-y-1">
            <div><strong>CSS Var:</strong> <span :style="mono">{{ s.cssVar }} ({{ s.value }})</span></div>
            <div><strong>Class:</strong> <span class="cursor-pointer" :style="mono" @click="selectText($event)">border-{{ s.name }}</span></div>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold mb-4">Radius</h2>
      <div class="grid grid-cols-1 gap-4">
        <div v-for="r in radii" :key="r.name" class="space-y-2">
          <div
            :style="{
              width: '160px',
              height: '56px',
              border: '1px solid var(--color-primitive-blue-400)',
              background: 'var(--color-primitive-blue-50)',
              borderRadius: 'var(' + r.cssVar + ')'
            }"
          />
          <div class="text-xs space-y-1">
            <div><strong>CSS Var:</strong> <span :style="mono">{{ r.cssVar }} ({{ r.value }})</span></div>
            <div><strong>Class:</strong> <span class="cursor-pointer" :style="mono" @click="selectText($event)">rounded-{{ r.name }}</span></div>
          </div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const widths = DesignTokenHelper.getBorderWidths()
    const styles = DesignTokenHelper.getBorderStyles()
    const radii = DesignTokenHelper.getRadii()

    const widthBorder = (w: { cssVar: string }) =>
      'var(' + w.cssVar + ') solid var(--color-primitive-blue-500)'
    const styleBorder = (s: { cssVar: string }) =>
      '2px var(' + s.cssVar + ') var(--color-primitive-blue-500)'

    return { widths, styles, radii, mono, widthBorder, styleBorder, selectText }
  },
}

export const Borders: Story = {
  render: () => ({
    components: { BorderShowcase },
    template: `<BorderShowcase />`,
  }),
}
