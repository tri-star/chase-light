import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { DesignTokenHelper } from './design-token-helper'

const meta: Meta = {
  title: 'Design System/Typography',
  parameters: {
    docs: {
      description: {
        component:
          'デザイントークンで定義されたフォントファミリー、スケール、セマンティックタイポグラフィのプレビューです。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const TypographyFonts = {
  template: `
    <section>
      <h2 class="text-2xl font-bold mb-4">Font Families</h2>
      <div class="grid grid-cols-1 gap-6">
        <div v-for="font in fonts" :key="font.name" class="space-y-2">
          <div
            :style="{
              fontFamily: 'var(' + font.cssVar + ')',
              fontSize: '18px',
              lineHeight: '1.7',
              border: '1px solid var(--color-primitive-gray-200)',
              borderRadius: '8px',
              padding: '16px',
            }"
          >
            <div class="opacity-70 text-sm mb-1">{{ font.name }}</div>
            <div>
              日本語の見本テキスト — 迅速な茶色の狐がのろまな犬を飛び越えた。
            </div>
            <div>
              The quick brown fox jumps over the lazy dog. 0123456789 !?@#
            </div>
          </div>
          <div class="text-xs space-y-1">
            <div>
              <strong>CSS Var:</strong>
              <span @click="selectText($event)" :style="mono">{{ font.cssVar }}</span>
            </div>
            <div>
              <strong>CSS Class:</strong>
              <span class="cursor-pointer" @click="selectText($event)" :style="mono">{{ fontClass(font.name) }}</span>
            </div>
            <div><strong>Resolved:</strong> <span :style="mono">{{ font.value }}</span></div>
          </div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const fonts = DesignTokenHelper.getTypographyFonts()

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
      padding: '2px 4px',
      borderRadius: '2px',
      backgroundColor: 'var(--color-primitive-gray-100)',
    }

    const fontClass = (name: string) => {
      if (name === 'sans') return 'font-sans'
      if (name === 'mono') return 'font-mono'
      return `font-${name}`
    }

    return { fonts, selectText, mono, fontClass }
  },
}

const TypographyScales = {
  template: `
    <section class="mt-12">
      <h2 class="text-2xl font-bold mb-4">Scales</h2>
      <div class="grid grid-cols-1 gap-6">
        <div v-for="scale in scales" :key="scale.name" class="space-y-2">
          <div
            :style="{
              font: 'var(' + scale.cssVar + ')',
              border: '1px solid var(--color-primitive-gray-200)',
              borderRadius: '8px',
              padding: '16px',
            }"
          >
            <div class="opacity-70 text-sm mb-1">scale.{{ scale.name }}</div>
            <div>見本テキスト — Aaあア亜</div>
            <div>The quick brown fox jumps over the lazy dog.</div>
          </div>
          <div class="text-xs space-y-1">
            <div>
              <strong>CSS Var:</strong>
              <span @click="selectText($event)" :style="mono">{{ scale.cssVar }}</span>
            </div>
            <div>
              <strong>CSS Class:</strong>
              <span class="cursor-pointer" @click="selectText($event)" :style="mono">{{ scaleClass(scale.name) }}</span>
            </div>
            <div><strong>Resolved:</strong> <span :style="mono">{{ scale.value }}</span></div>
          </div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const scales = DesignTokenHelper.getTypographyScales()

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
      padding: '2px 4px',
      borderRadius: '2px',
      backgroundColor: 'var(--color-primitive-gray-100)',
    }

    const scaleClass = (name: string) => `font-scale-${name}`
    return { scales, selectText, mono, scaleClass }
  },
}

const TypographySemantic = {
  template: `
    <section class="mt-12">
      <h2 class="text-2xl font-bold mb-4">Semantic</h2>
      <div class="grid grid-cols-1 gap-6">
        <div v-for="typo in semantics" :key="typo.name" class="space-y-2">
          <div
            :style="{
              font: 'var(' + typo.cssVar + ')',
              border: '1px solid var(--color-primitive-gray-200)',
              borderRadius: '8px',
              padding: '16px',
            }"
          >
            <div class="opacity-70 text-sm mb-1">semantic.{{ typo.name }}</div>
            <div>
              <template v-if="typo.name.startsWith('heading-')">見出し {{ typo.name.replace('heading-','').toUpperCase() }}</template>
              <template v-else-if="typo.name === 'body'">本文 Body</template>
              <template v-else-if="typo.name === 'body-sm'">本文 Body Small</template>
              <template v-else-if="typo.name === 'caption'">キャプション Caption</template>
              <template v-else-if="typo.name === 'code'">コード Code</template>
              <template v-else>{{ typo.name }}</template>
            </div>
            <div>The quick brown fox jumps over the lazy dog.</div>
          </div>
          <div class="text-xs space-y-1">
            <div>
              <strong>CSS Var:</strong>
              <span @click="selectText($event)" :style="mono">{{ typo.cssVar }}</span>
            </div>
            <div>
              <strong>CSS Class:</strong>
              <span class="cursor-pointer" @click="selectText($event)" :style="mono">{{ semanticClass(typo.name) }}</span>
            </div>
            <div><strong>Resolved:</strong> <span :style="mono">{{ typo.value }}</span></div>
          </div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const semantics = DesignTokenHelper.getTypographySemantic()

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
      padding: '2px 4px',
      borderRadius: '2px',
      backgroundColor: 'var(--color-primitive-gray-100)',
    }

    const semanticClass = (name: string) => `font-semantic-${name}`
    return { semantics, selectText, mono, semanticClass }
  },
}

export const Typography: Story = {
  render: () => ({
    components: { TypographyFonts, TypographyScales, TypographySemantic },
    template: `
      <div>
        <TypographyFonts />
        <TypographyScales />
        <TypographySemantic />
      </div>
    `,
  }),
}
