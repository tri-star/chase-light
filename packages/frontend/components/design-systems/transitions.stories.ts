import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { DesignTokenHelper } from './design-token-helper'

const meta: Meta = {
  title: 'Design System/Transitions',
  parameters: {
    docs: {
      description: {
        component:
          'トランジションのデュレーションとイージングをインタラクティブに可視化します。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const DurationsDemo = {
  props: { globalActive: { type: Boolean, required: false } },
  template: `
    <section>
      <div class="sticky top-0 z-50 py-2 mb-2" :style="stickyStyle">
        <h2 class="text-2xl font-bold inline-block mr-4">Durations</h2>
      </div>
      <div class="grid grid-cols-1 gap-6">
        <div v-for="d in durations" :key="d.name" class="space-y-2">
          <div class="text-xs"><strong>duration:</strong> <span :style="mono">{{ d.cssVar }} ({{ d.value }})</span></div>
          <div class="w-[280px] h-10 rounded bg-[oklch(87.585%_0.0123_247.97_/_.25)] relative overflow-hidden">
            <div
              :style="{
                position: 'absolute',
                top: '6px',
                left: isActive ? '220px' : '6px',
                width: '28px',
                height: '28px',
                background: 'var(--color-primitive-blue-500)',
                borderRadius: '9999px',
                transitionProperty: 'left',
                transitionDuration: 'var(' + d.cssVar + ')',
                transitionTimingFunction: 'cubic-bezier(var(--transition-easing-ease-in-out))',
              }"
            />
          </div>
          <div class="text-xs">
            <strong>Class:</strong> <span class="cursor-pointer" :style="mono" @click="selectText($event)">duration-{{ d.name }}</span>
          </div>
        </div>
      </div>
    </section>
  `,
  setup(props) {
    const durations = DesignTokenHelper.getTransitionDurations()
    const isActive = computed(() => !!props.globalActive)
    const mono = {
      fontFamily: 'monospace',
      backgroundColor: 'var(--color-primitive-gray-100)',
      borderRadius: '2px',
      padding: '1px 3px',
    }
    const stickyStyle = {
      position: 'sticky',
      top: '0px',
      background: 'var(--background-color-content-default)',
      borderBottom: '1px solid var(--border-color-interactive-hovered)',
    }
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
    return { durations, isActive, mono, stickyStyle, selectText }
  },
}

const EasingsDemo = {
  props: { globalActive: { type: Boolean, required: false } },
  template: `
    <section class="mt-12">
      <div class="sticky top-0 z-50 py-2 mb-2" :style="stickyStyle">
        <h2 class="text-2xl font-bold inline-block mr-4">Easings</h2>
      </div>
      <div class="grid grid-cols-1 gap-6">
        <div v-for="e in easings" :key="e.name" class="space-y-2">
          <div class="text-xs"><strong>easing:</strong> <span :style="mono">{{ e.cssVar }} ({{ e.value }})</span></div>
          <div class="w-[280px] h-10 rounded bg-[oklch(87.585%_0.0123_247.97_/_.25)] relative overflow-hidden">
            <div
              :style="{
                position: 'absolute',
                top: '6px',
                left: isActive ? '220px' : '6px',
                width: '28px',
                height: '28px',
                background: 'var(--color-primitive-green-500)',
                borderRadius: '9999px',
                transitionProperty: 'left',
                transitionDuration: 'var(--transition-duration-300)',
                transitionTimingFunction: 'cubic-bezier(var(' + e.cssVar + '))',
              }"
            />
          </div>
          <div class="text-xs">
            <strong>Class:</strong> <span class="cursor-pointer" :style="mono" @click="selectText($event)">ease-{{ e.name }}</span>
          </div>
        </div>
      </div>
    </section>
  `,
  setup(props) {
    const easings = DesignTokenHelper.getTransitionEasings()
    const isActive = computed(() => !!props.globalActive)
    const mono = {
      fontFamily: 'monospace',
      backgroundColor: 'var(--color-primitive-gray-100)',
      borderRadius: '2px',
      padding: '1px 3px',
    }
    const stickyStyle = {
      position: 'sticky',
      top: '0px',
      background: 'var(--background-color-content-default)',
      borderBottom: '1px solid var(--border-color-interactive-hovered)',
    }
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
    return { easings, isActive, mono, stickyStyle, selectText }
  },
}

export const Transitions: Story = {
  render: () => ({
    components: { DurationsDemo, EasingsDemo },
    setup() {
      const activeAll = ref(false)
      const toggleAll = () => (activeAll.value = !activeAll.value)
      const topBarStyle = {
        position: 'sticky',
        top: '0px',
        zIndex: 60,
        background: 'var(--background-color-content-default)',
        borderBottom: '1px solid var(--border-color-interactive-hovered)',
        padding: '8px 0',
      }
      return { activeAll, toggleAll, topBarStyle }
    },
    template: `
      <div>
        <div :style="topBarStyle">
          <button @click="toggleAll" class="px-3 py-1 rounded text-white" :style="{ background: 'var(--color-primitive-blue-700)', color: 'white' }">
            {{ activeAll ? 'Reset All' : 'Play All' }}
          </button>
        </div>
        <DurationsDemo :global-active="activeAll" />
        <EasingsDemo :global-active="activeAll" />
      </div>
    `,
  }),
}
