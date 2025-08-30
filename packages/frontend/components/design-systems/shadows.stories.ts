import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { DesignTokenHelper } from './design-token-helper'
import { mono, selectText } from './parts/story-utils'

const meta: Meta = {
  title: 'Design System/Shadows',
  parameters: {
    docs: {
      description: {
        component: 'ボックスシャドウの段階をカード風のサンプルで表示します。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const ShadowShowcase = {
  template: `
    <section>
      <h2 class="text-2xl font-bold mb-4">Shadows</h2>
      <div class="grid grid-cols-1 gap-6">
        <div v-for="s in shadows" :key="s.name" class="space-y-2">
          <div
            :style="{
              width: '220px',
              height: '110px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid var(--color-primitive-gray-200)',
              boxShadow: 'var(' + s.cssVar + ')'
            }"
            class="flex items-center justify-center"
          >
            <span class="text-sm">shadow.{{ s.name }}</span>
          </div>
          <div class="text-xs space-y-1">
            <div>
              <strong>CSS Var:</strong>
              <span :style="mono">{{ s.cssVar }}</span>
            </div>
            <div>
              <strong>Class:</strong>
              <span class="cursor-pointer" :style="mono" @click="selectText($event)">shadow-{{ s.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const shadows = DesignTokenHelper.getShadows()
    return { shadows, mono, selectText }
  },
}

export const Shadows: Story = {
  render: () => ({
    components: { ShadowShowcase },
    template: `<ShadowShowcase />`,
  }),
}
