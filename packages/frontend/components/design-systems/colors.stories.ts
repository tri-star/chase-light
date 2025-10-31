import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { DesignTokenHelper } from './design-token-helper'
import type { SemanticColorInfo } from './design-token-helper'

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

// テーマ切り替えコンポーネント
const ThemeToggle = {
  template: `
    <div class="mb-8">
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">テーマ切り替え</h3>
        <div class="flex gap-2 mb-4">
          <button 
            @click="setLightTheme"
            :style="{
              backgroundColor: currentTheme === 'light' ? 'var(--color-primitive-blue-500)' : 'var(--color-primitive-gray-200)',
              color: currentTheme === 'light' ? 'white' : 'var(--color-primitive-gray-700)',
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '4px',
              transition: 'colors 0.2s',
              border: 'none',
              cursor: 'pointer'
            }"
          >
            Light Theme
          </button>
          <button 
            @click="setDarkTheme"
            :style="{
              backgroundColor: currentTheme === 'dark' ? 'var(--color-primitive-blue-500)' : 'var(--color-primitive-gray-200)',
              color: currentTheme === 'dark' ? 'white' : 'var(--color-primitive-gray-700)',
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '4px',
              transition: 'colors 0.2s',
              border: 'none',
              cursor: 'pointer'
            }"
          >
            Dark Theme
          </button>
        </div>
      </div>
    </div>
  `,
  setup() {
    const currentTheme = ref('light')

    const setLightTheme = () => {
      currentTheme.value = 'light'
      document.documentElement.setAttribute('data-theme', 'light')
    }

    const setDarkTheme = () => {
      currentTheme.value = 'dark'
      document.documentElement.setAttribute('data-theme', 'dark')
    }

    // 初期化
    onMounted(() => {
      setLightTheme()
    })

    return {
      currentTheme,
      setLightTheme,
      setDarkTheme,
    }
  },
}

// プリミティブカラーコンポーネント
const PrimitiveColors = {
  template: `
    <div>
      <h2 class="text-2xl font-bold mb-6">Primitive Colors</h2>
      
      <h3 class="text-xl font-semibold mb-4">Gray Scale</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div v-for="color in grayColors" :key="color.name" class="space-y-2">
          <div 
            :style="{
              backgroundColor: 'var(' + color.bgCssVar + ')',
              color: 'var(' + color.textCssVar + ')',
              border: '1px solid var(' + color.borderCssVar + ')',
              width: '100%',
              height: '64px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }"
          >
            {{ color.name }}
          </div>
          <div class="text-xs space-y-1">
            <div><strong>Class:</strong> 
              <span 
                @click="selectText($event)"
                :style="{
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--color-primitive-gray-100)'
                }"
              >
                {{ color.bgClass }}
              </span>
            </div>
            <div><strong>Value:</strong> {{ color.value }}</div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Blue Scale</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div v-for="color in blueColors" :key="color.name" class="space-y-2">
          <div 
            :style="{
              backgroundColor: 'var(' + color.bgCssVar + ')',
              color: 'var(' + color.textCssVar + ')',
              border: '1px solid var(' + color.borderCssVar + ')',
              width: '100%',
              height: '64px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }"
          >
            {{ color.name }}
          </div>
          <div class="text-xs space-y-1">
            <div><strong>Class:</strong> 
              <span 
                @click="selectText($event)"
                :style="{
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--color-primitive-gray-100)'
                }"
              >
                {{ color.bgClass }}
              </span>
            </div>
            <div><strong>Value:</strong> {{ color.value }}</div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Green Scale</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div v-for="color in greenColors" :key="color.name" class="space-y-2">
          <div 
            :style="{
              backgroundColor: 'var(' + color.bgCssVar + ')',
              color: 'var(' + color.textCssVar + ')',
              border: '1px solid var(' + color.borderCssVar + ')',
              width: '100%',
              height: '64px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }"
          >
            {{ color.name }}
          </div>
          <div class="text-xs space-y-1">
            <div><strong>Class:</strong> 
              <span 
                @click="selectText($event)"
                :style="{
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--color-primitive-gray-100)'
                }"
              >
                {{ color.bgClass }}
              </span>
            </div>
            <div><strong>Value:</strong> {{ color.value }}</div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Other Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div v-for="color in otherColors" :key="color.name" class="space-y-2">
          <div 
            :style="{
              backgroundColor: 'var(' + color.bgCssVar + ')',
              color: 'var(' + color.textCssVar + ')',
              border: '1px solid var(' + color.borderCssVar + ')',
              width: '100%',
              height: '64px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }"
          >
            {{ color.name }}
          </div>
          <div class="text-xs space-y-1">
            <div><strong>Class:</strong> 
              <span 
                @click="selectText($event)"
                :style="{
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--color-primitive-gray-100)'
                }"
              >
                {{ color.bgClass }}
              </span>
            </div>
            <div><strong>Value:</strong> {{ color.value }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const primitiveColors = DesignTokenHelper.getPrimitiveColors()

    const selectText = (event: Event) => {
      const target = event.target as HTMLElement
      if (!target) return

      const range = document.createRange()
      range.selectNodeContents(target)
      const selection = window.getSelection()
      if (!selection) return

      selection.removeAllRanges()
      selection.addRange(range)
    }

    return {
      ...primitiveColors,
      selectText,
    }
  },
}

// セマンティックカラーコンポーネント
const SemanticColors = {
  template: `
    <div>
      <h2 class="text-2xl font-bold mb-6">Semantic Colors</h2>
      <p class="mb-6">セマンティックカラーは実際のUI要素として使用される色で、bg（背景）、text（テキスト）、border（ボーダー）の3つのプロパティを持ちます。Light/Darkテーマ切り替えボタンで表示を確認できます。</p>
      
      <h3 class="text-xl font-semibold mb-4">Content Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in contentStates" :key="state.name" class="space-y-3">
          <div 
            :style="{
              backgroundColor: 'var(' + state.bgCssVar + ')',
              color: 'var(' + state.textCssVar + ')',
              border: '1px solid var(' + state.borderCssVar + ')',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }"
          >
            {{ state.name }}
          </div>
          <div class="text-xs">
            <div><strong>Classes:</strong></div>
            <div class="ml-2 space-y-1">
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.bgClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.textClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.borderClass }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <h3 class="text-xl font-semibold mb-4">Surface Primary Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in surfacePrimaryStates" :key="state.name" class="space-y-3">
          <div 
            :style="{
              backgroundColor: 'var(' + state.bgCssVar + ')',
              color: 'var(' + state.textCssVar + ')',
              border: '1px solid var(' + state.borderCssVar + ')',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }"
          >
            {{ state.name }}
          </div>
          <div class="text-xs">
            <div><strong>Classes:</strong></div>
            <div class="ml-2 space-y-1">
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.bgClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.textClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.borderClass }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Surface Secondary Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in surfaceSecondaryStates" :key="state.name" class="space-y-3">
          <div 
            :style="{
              backgroundColor: 'var(' + state.bgCssVar + ')',
              color: 'var(' + state.textCssVar + ')',
              border: '1px solid var(' + state.borderCssVar + ')',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }"
          >
            {{ state.name }}
          </div>
          <div class="text-xs">
            <div><strong>Classes:</strong></div>
            <div class="ml-2 space-y-1">
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.bgClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.textClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.borderClass }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Interactive Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in interactiveStates" :key="state.name" class="space-y-3">
          <div 
            :style="{
              backgroundColor: 'var(' + state.bgCssVar + ')',
              color: 'var(' + state.textCssVar + ')',
              border: '1px solid var(' + state.borderCssVar + ')',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }"
          >
            {{ state.name }}
          </div>
          <div class="text-xs">
            <div><strong>Classes:</strong></div>
            <div class="ml-2 space-y-1">
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.bgClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.textClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.borderClass }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Surface Outlined Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in surfaceOutlinedStates" :key="state.name" class="space-y-3">
          <div 
            :style="{
              backgroundColor: 'var(' + state.bgCssVar + ')',
              color: 'var(' + state.textCssVar + ')',
              border: '1px solid var(' + state.borderCssVar + ')',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }"
          >
            {{ state.name }}
          </div>
          <div class="text-xs">
            <div><strong>Classes:</strong></div>
            <div class="ml-2 space-y-1">
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.bgClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.textClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.borderClass }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Header Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in headerStates" :key="state.name" class="space-y-3">
          <div 
            :style="{
              backgroundColor: 'var(' + state.bgCssVar + ')',
              color: 'var(' + state.textCssVar + ')',
              border: '1px solid var(' + state.borderCssVar + ')',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }"
          >
            {{ state.name }}
          </div>
          <div class="text-xs">
            <div><strong>Classes:</strong></div>
            <div class="ml-2 space-y-1">
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.bgClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.textClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.borderClass }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Sidebar Colors</h3>
      <div class="space-y-6 mb-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="state in sidebarBaseStates"
            :key="'sidebar-base-' + state.name"
            class="space-y-3"
          >
            <div 
              :style="{
                backgroundColor: 'var(' + state.bgCssVar + ')',
                color: 'var(' + state.textCssVar + ')',
                border: '1px solid var(' + state.borderCssVar + ')',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }"
            >
              {{ state.name }}
            </div>
            <div class="text-xs">
              <div><strong>Classes:</strong></div>
              <div class="ml-2 space-y-1">
                <div>
                  <span 
                    @click="selectText($event)"
                    :style="{
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      padding: '1px 3px',
                      borderRadius: '2px',
                      fontSize: '11px',
                      backgroundColor: 'var(--color-primitive-gray-100)'
                    }"
                  >
                    {{ state.bgClass }}
                  </span>
                </div>
                <div>
                  <span 
                    @click="selectText($event)"
                    :style="{
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      padding: '1px 3px',
                      borderRadius: '2px',
                      fontSize: '11px',
                      backgroundColor: 'var(--color-primitive-gray-100)'
                    }"
                  >
                    {{ state.textClass }}
                  </span>
                </div>
                <div>
                  <span 
                    @click="selectText($event)"
                    :style="{
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      padding: '1px 3px',
                      borderRadius: '2px',
                      fontSize: '11px',
                      backgroundColor: 'var(--color-primitive-gray-100)'
                    }"
                  >
                    {{ state.borderClass }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-for="group in sidebarChildGroups"
          :key="group.subcategory"
          class="space-y-3 pl-4 md:pl-6"
          :style="{ borderLeft: '1px dashed var(--border-color-sidebar-default)' }"
        >
          <h4 class="text-lg font-semibold">
            {{ formatSidebarSubcategory(group.subcategory) }}
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="state in group.states"
              :key="'sidebar-' + group.subcategory + '-' + state.name"
              class="space-y-3"
            >
              <div 
                :style="{
                  backgroundColor: 'var(' + state.bgCssVar + ')',
                  color: 'var(' + state.textCssVar + ')',
                  border: '1px solid var(' + state.borderCssVar + ')',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center'
                }"
              >
                {{ state.name }}
              </div>
              <div class="text-xs">
                <div><strong>Classes:</strong></div>
                <div class="ml-2 space-y-1">
                  <div>
                    <span 
                      @click="selectText($event)"
                      :style="{
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        padding: '1px 3px',
                        borderRadius: '2px',
                        fontSize: '11px',
                        backgroundColor: 'var(--color-primitive-gray-100)'
                      }"
                    >
                      {{ state.bgClass }}
                    </span>
                  </div>
                  <div>
                    <span 
                      @click="selectText($event)"
                      :style="{
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        padding: '1px 3px',
                        borderRadius: '2px',
                        fontSize: '11px',
                        backgroundColor: 'var(--color-primitive-gray-100)'
                      }"
                    >
                      {{ state.textClass }}
                    </span>
                  </div>
                  <div>
                    <span 
                      @click="selectText($event)"
                      :style="{
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        padding: '1px 3px',
                        borderRadius: '2px',
                        fontSize: '11px',
                        backgroundColor: 'var(--color-primitive-gray-100)'
                      }"
                    >
                      {{ state.borderClass }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Dialog Colors</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="state in dialogStates" :key="state.name" class="space-y-3">
          <div 
            :style="{
              backgroundColor: 'var(' + state.bgCssVar + ')',
              color: 'var(' + state.textCssVar + ')',
              border: '1px solid var(' + state.borderCssVar + ')',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }"
          >
            {{ state.name }}
          </div>
          <div class="text-xs">
            <div><strong>Classes:</strong></div>
            <div class="ml-2 space-y-1">
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.bgClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.textClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.borderClass }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-semibold mb-4">Status Colors</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div v-for="state in statusColors" :key="state.name" class="space-y-3">
          <div 
            :style="{
              backgroundColor: 'var(' + state.bgCssVar + ')',
              color: 'var(' + state.textCssVar + ')',
              border: '1px solid var(' + state.borderCssVar + ')',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }"
          >
            {{ state.name }}
          </div>
          <div class="text-xs">
            <div><strong>Classes:</strong></div>
            <div class="ml-2 space-y-1">
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.bgClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.textClass }}
                </span>
              </div>
              <div>
                <span 
                  @click="selectText($event)"
                  :style="{
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-primitive-gray-100)'
                  }"
                >
                  {{ state.borderClass }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const semanticColors = DesignTokenHelper.getSemanticColors()
    const sidebarBaseStates = computed(() =>
      semanticColors.sidebarStates.filter((state) => !state.subcategory)
    )
    const sidebarChildGroups = computed(() => {
      const statesWithSubcategory = semanticColors.sidebarStates.filter(
        (state): state is SemanticColorInfo & { subcategory: string } =>
          Boolean(state.subcategory)
      )
      const groups = statesWithSubcategory.reduce(
        (acc, state) => {
          const key = state.subcategory
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(state)
          return acc
        },
        {} as Record<string, SemanticColorInfo[]>
      )

      return Object.entries(groups).map(([subcategory, states]) => ({
        subcategory,
        states,
      }))
    })
    const formatSidebarSubcategory = (value: string) =>
      value
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')

    const selectText = (event: Event) => {
      const target = event.target as HTMLElement
      if (!target) return

      const range = document.createRange()
      range.selectNodeContents(target)
      const selection = window.getSelection()
      if (!selection) return

      selection.removeAllRanges()
      selection.addRange(range)
    }

    return {
      ...semanticColors,
      sidebarBaseStates,
      sidebarChildGroups,
      formatSidebarSubcategory,
      selectText,
    }
  },
}

// ストーリーの定義
export const Colors: Story = {
  render: () => ({
    components: {
      ThemeToggle,
      PrimitiveColors,
      SemanticColors,
    },
    template: `
      <div>
        <ThemeToggle />
        <PrimitiveColors />
        <div class="mt-16">
          <SemanticColors />
        </div>
      </div>
    `,
  }),
}
