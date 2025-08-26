import type { StoryObj, Meta } from '@nuxtjs/storybook'

const meta: Meta = {
  title: 'Design System/Colors',
  parameters: {
    docs: {
      description: {
        component: 'デザイントークンで定義されたカラーパレットです。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Theme Toggle Component
const ThemeToggle = {
  template: `
    <div class="mb-8">
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">テーマ切り替え</h3>
        <div class="flex gap-2 mb-4">
          <button 
            @click="setLightTheme"
            class="px-4 py-2 text-sm bg-primitive-blue-500 text-white rounded hover:bg-primitive-blue-600 transition-colors"
          >
            Light Theme
          </button>
          <button 
            @click="setDarkTheme"
            class="px-4 py-2 text-sm bg-primitive-gray-700 text-white rounded hover:bg-primitive-gray-600 transition-colors"
          >
            Dark Theme
          </button>
        </div>
      </div>
    </div>
  `,
  setup() {
    const { setTheme } = useTheme()

    return {
      setLightTheme() {
        setTheme('light')
      },
      setDarkTheme() {
        setTheme('dark')
      },
    }
  },
}

// Primitive Colors Component
const PrimitiveColors = {
  template: `
    <div>
      <h2 class="text-2xl font-bold mb-6">Primitive Colors</h2>
      
      <h3 class="text-xl font-semibold mb-4">Gray Scale</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div v-for="color in grayColors" :key="color.name" class="space-y-2">
          <div :class="['w-full', 'h-16', 'rounded', 'flex', 'items-center', 'justify-center', 'text-sm', color.bgClass, color.borderClass, color.textClass]">
            {{ color.name }}
          </div>
          <div class="text-xs space-y-1">
            <div><strong>Class:</strong> {{ color.bgClass }}</div>
            <div><strong>Value:</strong> {{ color.value }}</div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Blue Scale</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div v-for="color in blueColors" :key="color.name" class="space-y-2">
          <div :class="['w-full', 'h-16', 'rounded', 'flex', 'items-center', 'justify-center', 'text-sm', color.bgClass, color.borderClass, color.textClass]">
            {{ color.name }}
          </div>
          <div class="text-xs space-y-1">
            <div><strong>Class:</strong> {{ color.bgClass }}</div>
            <div><strong>Value:</strong> {{ color.value }}</div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Green Scale</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div v-for="color in greenColors" :key="color.name" class="space-y-2">
          <div :class="['w-full', 'h-16', 'rounded', 'flex', 'items-center', 'justify-center', 'text-sm', color.bgClass, color.borderClass, color.textClass]">
            {{ color.name }}
          </div>
          <div class="text-xs space-y-1">
            <div><strong>Class:</strong> {{ color.bgClass }}</div>
            <div><strong>Value:</strong> {{ color.value }}</div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Other Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div v-for="color in otherColors" :key="color.name" class="space-y-2">
          <div :class="['w-full', 'h-16', 'rounded', 'flex', 'items-center', 'justify-center', 'text-sm', color.bgClass, color.borderClass, color.textClass]">
            {{ color.name }}
          </div>
          <div class="text-xs space-y-1">
            <div><strong>Class:</strong> {{ color.bgClass }}</div>
            <div><strong>Usage:</strong> {{ color.usage }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      grayColors: [
        {
          name: 'Gray 50',
          bgClass: 'bg-primitive-gray-50',
          borderClass: 'border border-primitive-gray-200',
          textClass: '',
          value: 'oklch(97.818% 0.00342 247.86)',
        },
        {
          name: 'Gray 100',
          bgClass: 'bg-primitive-gray-100',
          borderClass: 'border border-primitive-gray-200',
          textClass: '',
          value: 'oklch(94.722% 0.00689 247.9)',
        },
        {
          name: 'Gray 200',
          bgClass: 'bg-primitive-gray-200',
          borderClass: 'border border-primitive-gray-300',
          textClass: '',
          value: 'oklch(87.585% 0.0123 247.97)',
        },
        {
          name: 'Gray 300',
          bgClass: 'bg-primitive-gray-300',
          borderClass: 'border border-primitive-gray-400',
          textClass: '',
          value: 'oklch(77.83% 0.01628 248.04)',
        },
        {
          name: 'Gray 400',
          bgClass: 'bg-primitive-gray-400',
          borderClass: 'border border-primitive-gray-500',
          textClass: 'text-white',
          value: 'oklch(66.576% 0.01812 250.92)',
        },
        {
          name: 'Gray 500',
          bgClass: 'bg-primitive-gray-500',
          borderClass: 'border border-primitive-gray-600',
          textClass: 'text-white',
          value: 'oklch(56.511% 0.01888 250.97)',
        },
        {
          name: 'Gray 600',
          bgClass: 'bg-primitive-gray-600',
          borderClass: 'border border-primitive-gray-700',
          textClass: 'text-white',
          value: 'oklch(48.485% 0.01961 251.02)',
        },
        {
          name: 'Gray 700',
          bgClass: 'bg-primitive-gray-700',
          borderClass: 'border border-primitive-gray-800',
          textClass: 'text-white',
          value: 'oklch(40.532% 0.01838 251.38)',
        },
        {
          name: 'Gray 800',
          bgClass: 'bg-primitive-gray-800',
          borderClass: 'border border-primitive-gray-900',
          textClass: 'text-white',
          value: 'oklch(33.779% 0.0148 252.3)',
        },
        {
          name: 'Gray 900',
          bgClass: 'bg-primitive-gray-900',
          borderClass: 'border border-primitive-gray-800',
          textClass: 'text-white',
          value: 'oklch(27.85% 0.0132 253.04)',
        },
      ],
      blueColors: [
        {
          name: 'Blue 50',
          bgClass: 'bg-primitive-blue-50',
          borderClass: 'border border-primitive-blue-100',
          textClass: '',
          value: 'oklch(95.363% 0.02839 228.04)',
        },
        {
          name: 'Blue 100',
          bgClass: 'bg-primitive-blue-100',
          borderClass: 'border border-primitive-blue-200',
          textClass: '',
          value: 'oklch(89.336% 0.06061 235.67)',
        },
        {
          name: 'Blue 200',
          bgClass: 'bg-primitive-blue-200',
          borderClass: 'border border-primitive-blue-300',
          textClass: '',
          value: 'oklch(81.491% 0.10452 239.21)',
        },
        {
          name: 'Blue 300',
          bgClass: 'bg-primitive-blue-300',
          borderClass: 'border border-primitive-blue-400',
          textClass: '',
          value: 'oklch(73.111% 0.14618 248.34)',
        },
        {
          name: 'Blue 400',
          bgClass: 'bg-primitive-blue-400',
          borderClass: 'border border-primitive-blue-500',
          textClass: 'text-white',
          value: 'oklch(64.176% 0.19508 254.98)',
        },
        {
          name: 'Blue 500',
          bgClass: 'bg-primitive-blue-500',
          borderClass: 'border border-primitive-blue-600',
          textClass: 'text-white',
          value: 'oklch(53.992% 0.19058 257.48)',
        },
        {
          name: 'Blue 600',
          bgClass: 'bg-primitive-blue-600',
          borderClass: 'border border-primitive-blue-700',
          textClass: 'text-white',
          value: 'oklch(45.095% 0.16414 258.18)',
        },
        {
          name: 'Blue 700',
          bgClass: 'bg-primitive-blue-700',
          borderClass: 'border border-primitive-blue-800',
          textClass: 'text-white',
          value: 'oklch(37.904% 0.14115 258.7)',
        },
        {
          name: 'Blue 800',
          bgClass: 'bg-primitive-blue-800',
          borderClass: 'border border-primitive-blue-900',
          textClass: 'text-white',
          value: 'oklch(32.103% 0.10845 259.11)',
        },
        {
          name: 'Blue 900',
          bgClass: 'bg-primitive-blue-900',
          borderClass: 'border border-primitive-blue-800',
          textClass: 'text-white',
          value: 'oklch(26.347% 0.10217 259.01)',
        },
      ],
      greenColors: [
        {
          name: 'Green 50',
          bgClass: 'bg-primitive-green-50',
          borderClass: 'border border-primitive-green-100',
          textClass: '',
          value: 'oklch(95.744% 0.04868 151.63)',
        },
        {
          name: 'Green 100',
          bgClass: 'bg-primitive-green-100',
          borderClass: 'border border-primitive-green-200',
          textClass: '',
          value: 'oklch(89.15% 0.09641 151.11)',
        },
        {
          name: 'Green 200',
          bgClass: 'bg-primitive-green-200',
          borderClass: 'border border-primitive-green-300',
          textClass: '',
          value: 'oklch(81.192% 0.15403 150.05)',
        },
        {
          name: 'Green 300',
          bgClass: 'bg-primitive-green-300',
          borderClass: 'border border-primitive-green-400',
          textClass: '',
          value: 'oklch(72.568% 0.16427 149.45)',
        },
        {
          name: 'Green 400',
          bgClass: 'bg-primitive-green-400',
          borderClass: 'border border-primitive-green-500',
          textClass: 'text-white',
          value: 'oklch(63.434% 0.16195 148.39)',
        },
        {
          name: 'Green 500',
          bgClass: 'bg-primitive-green-500',
          borderClass: 'border border-primitive-green-600',
          textClass: 'text-white',
          value: 'oklch(52.441% 0.14008 148.04)',
        },
        {
          name: 'Green 600',
          bgClass: 'bg-primitive-green-600',
          borderClass: 'border border-primitive-green-700',
          textClass: 'text-white',
          value: 'oklch(43.906% 0.11793 148.07)',
        },
        {
          name: 'Green 700',
          bgClass: 'bg-primitive-green-700',
          borderClass: 'border border-primitive-green-800',
          textClass: 'text-white',
          value: 'oklch(37.41% 0.10418 148.53)',
        },
        {
          name: 'Green 800',
          bgClass: 'bg-primitive-green-800',
          borderClass: 'border border-primitive-green-900',
          textClass: 'text-white',
          value: 'oklch(31.442% 0.08812 149.27)',
        },
        {
          name: 'Green 900',
          bgClass: 'bg-primitive-green-900',
          borderClass: 'border border-primitive-green-800',
          textClass: 'text-white',
          value: 'oklch(26.001% 0.06982 151.09)',
        },
      ],
      otherColors: [
        {
          name: 'Yellow 200',
          bgClass: 'bg-primitive-yellow-200',
          borderClass: 'border border-primitive-yellow-300',
          textClass: '',
          usage: 'Warn backgrounds',
        },
        {
          name: 'Yellow 500',
          bgClass: 'bg-primitive-yellow-500',
          borderClass: 'border border-primitive-yellow-600',
          textClass: 'text-white',
          usage: 'Warning accents',
        },
        {
          name: 'Red 200',
          bgClass: 'bg-primitive-red-200',
          borderClass: 'border border-primitive-red-300',
          textClass: '',
          usage: 'Error backgrounds',
        },
        {
          name: 'Red 500',
          bgClass: 'bg-primitive-red-500',
          borderClass: 'border border-primitive-red-600',
          textClass: 'text-white',
          usage: 'Error accents',
        },
        {
          name: 'Black',
          bgClass: 'bg-primitive-black',
          borderClass: 'border border-primitive-gray-700',
          textClass: 'text-white',
          usage: 'Pure black',
        },
      ],
    }
  },
}

// Semantic Colors Component
const SemanticColors = {
  template: `
    <div>
      <h2 class="text-2xl font-bold mb-6">Semantic Colors</h2>
      <p class="mb-6">セマンティックカラーは実際のUI要素として使用される色で、bg（背景）、text（テキスト）、border（ボーダー）の3つのプロパティを持ちます。Light/Darkテーマ切り替えボタンで表示を確認できます。</p>
      
      <h3 class="text-xl font-semibold mb-4">Content Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in contentStates" :key="state.name" class="space-y-3">
          <div :class="['rounded-lg', 'p-4', 'text-center', state.classes]">
            {{ state.name }}
          </div>
          <div class="text-sm space-y-1">
            <div><strong>Classes:</strong></div>
            <div class="space-y-1">
              <div 
                v-for="className in state.classNames" 
                :key="className"
                @click="selectText($event)"
                class="font-mono text-xs cursor-pointer hover:bg-primitive-gray-100 dark:hover:bg-primitive-gray-800 p-1 rounded"
              >
                {{ className }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Surface Colors - Primary</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in primaryStates" :key="state.name" class="space-y-3">
          <div :class="['rounded-lg', 'p-4', 'text-center', state.classes]">
            {{ state.name }}
          </div>
          <div class="text-sm space-y-1">
            <div><strong>Classes:</strong></div>
            <div class="space-y-1">
              <div 
                v-for="className in state.classNames" 
                :key="className"
                @click="selectText($event)"
                class="font-mono text-xs cursor-pointer hover:bg-primitive-gray-100 dark:hover:bg-primitive-gray-800 p-1 rounded"
              >
                {{ className }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Surface Colors - Secondary</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in secondaryStates" :key="state.name" class="space-y-3">
          <div :class="['rounded-lg', 'p-4', 'text-center', state.classes]">
            {{ state.name }}
          </div>
          <div class="text-sm space-y-1">
            <div><strong>Classes:</strong></div>
            <div class="space-y-1">
              <div 
                v-for="className in state.classNames" 
                :key="className"
                @click="selectText($event)"
                class="font-mono text-xs cursor-pointer hover:bg-primitive-gray-100 dark:hover:bg-primitive-gray-800 p-1 rounded"
              >
                {{ className }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Interactive Colors (Form Inputs)</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in interactiveStates" :key="state.name" class="space-y-3">
          <div :class="['rounded-lg', 'p-4', 'text-center', state.classes]">
            {{ state.name }}
          </div>
          <div class="text-sm space-y-1">
            <div><strong>Classes:</strong></div>
            <div class="space-y-1">
              <div 
                v-for="className in state.classNames" 
                :key="className"
                @click="selectText($event)"
                class="font-mono text-xs cursor-pointer hover:bg-primitive-gray-100 dark:hover:bg-primitive-gray-800 p-1 rounded"
              >
                {{ className }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Header Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in headerStates" :key="state.name" class="space-y-3">
          <div :class="['rounded-lg', 'p-4', 'text-center', state.classes]">
            {{ state.name }}
          </div>
          <div class="text-sm space-y-1">
            <div><strong>Classes:</strong></div>
            <div class="space-y-1">
              <div 
                v-for="className in state.classNames" 
                :key="className"
                @click="selectText($event)"
                class="font-mono text-xs cursor-pointer hover:bg-primitive-gray-100 dark:hover:bg-primitive-gray-800 p-1 rounded"
              >
                {{ className }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Sidebar Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in sidebarStates" :key="state.name" class="space-y-3">
          <div :class="['rounded-lg', 'p-4', 'text-center', state.classes]">
            {{ state.name }}
          </div>
          <div class="text-sm space-y-1">
            <div><strong>Classes:</strong></div>
            <div class="space-y-1">
              <div 
                v-for="className in state.classNames" 
                :key="className"
                @click="selectText($event)"
                class="font-mono text-xs cursor-pointer hover:bg-primitive-gray-100 dark:hover:bg-primitive-gray-800 p-1 rounded"
              >
                {{ className }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Dialog Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in dialogStates" :key="state.name" class="space-y-3">
          <div :class="['rounded-lg', 'p-4', 'text-center', state.classes]">
            {{ state.name }}
          </div>
          <div class="text-sm space-y-1">
            <div><strong>Classes:</strong></div>
            <div class="space-y-1">
              <div 
                v-for="className in state.classNames" 
                :key="className"
                @click="selectText($event)"
                class="font-mono text-xs cursor-pointer hover:bg-primitive-gray-100 dark:hover:bg-primitive-gray-800 p-1 rounded"
              >
                {{ className }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Common Status Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="status in statusColors" :key="status.name" class="space-y-3">
          <div :class="['rounded-lg', 'p-4', 'text-center', status.classes]">
            {{ status.name }}
          </div>
          <div class="text-sm space-y-1">
            <div><strong>Classes:</strong></div>
            <div class="space-y-1">
              <div 
                v-for="className in status.classNames" 
                :key="className"
                @click="selectText($event)"
                class="font-mono text-xs cursor-pointer hover:bg-primitive-gray-100 dark:hover:bg-primitive-gray-800 p-1 rounded"
              >
                {{ className }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    selectText(event: Event) {
      const target = event.target as HTMLElement
      if (!target) return

      const range = document.createRange()
      range.selectNodeContents(target)
      const selection = window.getSelection()
      if (!selection) return

      selection.removeAllRanges()
      selection.addRange(range)
    },
  },
  data() {
    return {
      contentStates: [
        {
          name: 'Default Content',
          classes:
            'bg-content-default text-content-default border border-content-default',
          classNames: [
            'bg-content-default',
            'text-content-default',
            'border-content-default',
          ],
        },
        {
          name: 'Inverse Content',
          classes:
            'bg-content-inverse text-content-inverse border border-content-inverse',
          classNames: [
            'bg-content-inverse',
            'text-content-inverse',
            'border-content-inverse',
          ],
        },
        {
          name: 'Disabled Content',
          classes:
            'bg-content-disabled text-content-disabled border border-content-disabled',
          classNames: [
            'bg-content-disabled',
            'text-content-disabled',
            'border-content-disabled',
          ],
        },
        {
          name: 'Placeholder Content',
          classes:
            'bg-content-placeholder text-content-placeholder border border-content-placeholder',
          classNames: [
            'bg-content-placeholder',
            'text-content-placeholder',
            'border-content-placeholder',
          ],
        },
      ],
      headerStates: [
        {
          name: 'Default Header',
          classes:
            'bg-header-default text-header-default border border-header-default',
          classNames: [
            'bg-header-default',
            'text-header-default',
            'border-header-default',
          ],
        },
        {
          name: 'Inverse Header',
          classes:
            'bg-header-inverse text-header-inverse border border-header-inverse',
          classNames: [
            'bg-header-inverse',
            'text-header-inverse',
            'border-header-inverse',
          ],
        },
        {
          name: 'Active Header',
          classes:
            'bg-header-active text-header-active border border-header-active',
          classNames: [
            'bg-header-active',
            'text-header-active',
            'border-header-active',
          ],
        },
        {
          name: 'Hovered Header',
          classes:
            'bg-header-hovered text-header-hovered border border-header-hovered',
          classNames: [
            'bg-header-hovered',
            'text-header-hovered',
            'border-header-hovered',
          ],
        },
      ],
      sidebarStates: [
        {
          name: 'Default Sidebar',
          classes:
            'bg-sidebar-default text-sidebar-default border border-sidebar-default',
          classNames: [
            'bg-sidebar-default',
            'text-sidebar-default',
            'border-sidebar-default',
          ],
        },
        {
          name: 'Inverse Sidebar',
          classes:
            'bg-sidebar-inverse text-sidebar-inverse border border-sidebar-inverse',
          classNames: [
            'bg-sidebar-inverse',
            'text-sidebar-inverse',
            'border-sidebar-inverse',
          ],
        },
        {
          name: 'Active Sidebar',
          classes:
            'bg-sidebar-active text-sidebar-active border border-sidebar-active',
          classNames: [
            'bg-sidebar-active',
            'text-sidebar-active',
            'border-sidebar-active',
          ],
        },
        {
          name: 'Hovered Sidebar',
          classes:
            'bg-sidebar-hovered text-sidebar-hovered border border-sidebar-hovered',
          classNames: [
            'bg-sidebar-hovered',
            'text-sidebar-hovered',
            'border-sidebar-hovered',
          ],
        },
      ],
      dialogStates: [
        {
          name: 'Default Dialog',
          classes:
            'bg-dialog-default text-dialog-default border border-dialog-default',
          classNames: [
            'bg-dialog-default',
            'text-dialog-default',
            'border-dialog-default',
          ],
        },
        {
          name: 'Overlay Dialog',
          classes:
            'bg-dialog-overlay text-dialog-overlay border border-dialog-overlay',
          classNames: [
            'bg-dialog-overlay',
            'text-dialog-overlay',
            'border-dialog-overlay',
          ],
        },
        {
          name: 'Backdrop Dialog',
          classes:
            'bg-dialog-backdrop text-dialog-backdrop border border-dialog-backdrop',
          classNames: [
            'bg-dialog-backdrop',
            'text-dialog-backdrop',
            'border-dialog-backdrop',
          ],
        },
      ],
      primaryStates: [
        {
          name: 'Default State',
          classes:
            'bg-surface-primary-default text-surface-primary-default border border-surface-primary-default',
          classNames: [
            'bg-surface-primary-default',
            'text-surface-primary-default',
            'border-surface-primary-default',
          ],
        },
        {
          name: 'Disabled State',
          classes:
            'bg-surface-primary-disabled text-surface-primary-disabled border border-surface-primary-disabled',
          classNames: [
            'bg-surface-primary-disabled',
            'text-surface-primary-disabled',
            'border-surface-primary-disabled',
          ],
        },
        {
          name: 'Hovered State',
          classes:
            'bg-surface-primary-hovered text-surface-primary-hovered border border-surface-primary-hovered',
          classNames: [
            'bg-surface-primary-hovered',
            'text-surface-primary-hovered',
            'border-surface-primary-hovered',
          ],
        },
        {
          name: 'Pressed State',
          classes:
            'bg-surface-primary-pressed text-surface-primary-pressed border border-surface-primary-pressed',
          classNames: [
            'bg-surface-primary-pressed',
            'text-surface-primary-pressed',
            'border-surface-primary-pressed',
          ],
        },
      ],
      secondaryStates: [
        {
          name: 'Default State',
          classes:
            'bg-surface-secondary-default text-surface-secondary-default border border-surface-secondary-default',
          classNames: [
            'bg-surface-secondary-default',
            'text-surface-secondary-default',
            'border-surface-secondary-default',
          ],
        },
        {
          name: 'Disabled State',
          classes:
            'bg-surface-secondary-disabled text-surface-secondary-disabled border border-surface-secondary-disabled',
          classNames: [
            'bg-surface-secondary-disabled',
            'text-surface-secondary-disabled',
            'border-surface-secondary-disabled',
          ],
        },
        {
          name: 'Hovered State',
          classes:
            'bg-surface-secondary-hovered text-surface-secondary-hovered border border-surface-secondary-hovered',
          classNames: [
            'bg-surface-secondary-hovered',
            'text-surface-secondary-hovered',
            'border-surface-secondary-hovered',
          ],
        },
        {
          name: 'Pressed State',
          classes:
            'bg-surface-secondary-pressed text-surface-secondary-pressed border border-surface-secondary-pressed',
          classNames: [
            'bg-surface-secondary-pressed',
            'text-surface-secondary-pressed',
            'border-surface-secondary-pressed',
          ],
        },
      ],
      interactiveStates: [
        {
          name: 'Default Input',
          classes:
            'bg-interactive-default text-interactive-default border border-interactive-default',
          classNames: [
            'bg-interactive-default',
            'text-interactive-default',
            'border-interactive-default',
          ],
        },
        {
          name: 'Disabled Input',
          classes:
            'bg-interactive-disabled text-interactive-disabled border border-interactive-disabled',
          classNames: [
            'bg-interactive-disabled',
            'text-interactive-disabled',
            'border-interactive-disabled',
          ],
        },
        {
          name: 'Focused Input',
          classes:
            'bg-interactive-focused text-interactive-focused border border-interactive-focused',
          classNames: [
            'bg-interactive-focused',
            'text-interactive-focused',
            'border-interactive-focused',
          ],
        },
        {
          name: 'Hovered Input',
          classes:
            'bg-interactive-hovered text-interactive-hovered border border-interactive-hovered',
          classNames: [
            'bg-interactive-hovered',
            'text-interactive-hovered',
            'border-interactive-hovered',
          ],
        },
      ],
      statusColors: [
        {
          name: 'Info Message',
          classes: 'bg-status-info text-status-info border border-status-info',
          classNames: [
            'bg-status-info',
            'text-status-info',
            'border-status-info',
          ],
        },
        {
          name: 'Success Message',
          classes:
            'bg-status-success text-status-success border border-status-success',
          classNames: [
            'bg-status-success',
            'text-status-success',
            'border-status-success',
          ],
        },
        {
          name: 'Warning Message',
          classes: 'bg-status-warn text-status-warn border border-status-warn',
          classNames: [
            'bg-status-warn',
            'text-status-warn',
            'border-status-warn',
          ],
        },
        {
          name: 'Error Message',
          classes:
            'bg-status-alert text-status-alert border border-status-alert',
          classNames: [
            'bg-status-alert',
            'text-status-alert',
            'border-status-alert',
          ],
        },
      ],
    }
  },
}

export const Overview: Story = {
  render: () => ({
    components: { ThemeToggle, PrimitiveColors, SemanticColors },
    template: `
      <div class="p-6">
        <ThemeToggle />
        <PrimitiveColors />
        <SemanticColors />
      </div>
    `,
  }),
}
