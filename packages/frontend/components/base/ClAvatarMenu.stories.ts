/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StoryObj, Meta } from '@nuxtjs/storybook'
import ClAvatarMenu from './ClAvatarMenu.vue'

const meta: Meta<typeof ClAvatarMenu> = {
  title: 'Components/Base/ClAvatarMenu',
  component: ClAvatarMenu,
  parameters: {
    docs: {
      description: {
        component:
          'ユーザーアバターとドロップダウンメニューコンポーネントです。プロフィール表示、プロフィール編集、ログアウト機能を提供します。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// モックユーザーデータ
const mockUser = {
  id: 'user-123',
  name: '田中太郎',
  email: 'tanaka.taro@example.com',
  avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
}

const mockUserNoAvatar = {
  id: 'user-456',
  name: '佐藤花子',
  email: 'sato.hanako@example.com',
  avatar: null,
}

// Storybook用のモックコンポーネント
const ClAvatarMenuMock = {
  props: {
    user: {
      type: Object as PropType<typeof mockUser | null>,
      default: null,
    },
  },
  setup(props: { user: typeof mockUser | null }) {
    const isOpen = ref(false)
    const menuRef = ref<HTMLElement>()

    const toggleMenu = () => {
      isOpen.value = !isOpen.value
    }

    const closeMenu = () => {
      isOpen.value = false
    }

    const handleLogout = async () => {
      closeMenu()
      console.log('Logout clicked (Storybook mock)')
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    const handleClickOutside = (event: Event) => {
      if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
        closeMenu()
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeydown)
    })

    return {
      user: computed(() => props.user),
      isOpen,
      menuRef,
      toggleMenu,
      closeMenu,
      handleLogout,
    }
  },
  template: `
    <div ref="menuRef" class="relative">
      <!-- Avatar button -->
      <button
        type="button"
        class="flex items-center space-x-2 p-2 rounded-full text-interactive-default hover:bg-interactive-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default transition-colors"
        :aria-expanded="isOpen"
        aria-haspopup="true"
        @click="toggleMenu"
      >
        <img
          v-if="user?.avatar"
          :src="user.avatar"
          :alt="user.name || 'ユーザーアバター'"
          class="w-8 h-8 rounded-full"
        />
        <div
          v-else
          class="w-8 h-8 rounded-full bg-surface-secondary-default flex items-center justify-center"
        >
          <svg
            class="w-5 h-5 text-content-default"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <span
          v-if="user?.name"
          class="text-sm text-content-default hidden sm:block"
        >
          {{ user.name }}
        </span>
      </button>

      <!-- Dropdown menu -->
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-dialog-default shadow-lg border border-dialog-default z-50"
        >
          <div class="py-1" role="menu" aria-orientation="vertical">
            <div
              class="px-4 py-2 text-sm text-dialog-default border-b border-dialog-default"
            >
              <div class="font-medium">{{ user?.name || 'ゲスト' }}</div>
              <div class="text-xs text-content-default opacity-75">
                {{ user?.email || '' }}
              </div>
            </div>

            <a
              href="#"
              class="block px-4 py-2 text-sm text-dialog-default hover:bg-surface-secondary-hovered transition-colors"
              role="menuitem"
              @click.prevent="closeMenu"
            >
              プロフィール
            </a>

            <button
              type="button"
              class="block w-full text-left px-4 py-2 text-sm text-status-alert-default hover:bg-surface-secondary-hovered transition-colors"
              role="menuitem"
              @click="handleLogout"
            >
              ログアウト
            </button>
          </div>
        </div>
      </Transition>
    </div>
  `,
}

export const WithAvatar: Story = {
  render: () =>
    ({
      components: { ClAvatarMenuMock },
      setup() {
        return {
          user: mockUser,
        }
      },
      template: `
      <div class="p-8 flex justify-end">
        <ClAvatarMenuMock :user="user" />
      </div>
    `,
    }) as any,
}

export const WithoutAvatar: Story = {
  render: () =>
    ({
      components: { ClAvatarMenuMock },
      setup() {
        return {
          user: mockUserNoAvatar,
        }
      },
      template: `
      <div class="p-8 flex justify-end">
        <ClAvatarMenuMock :user="user" />
      </div>
    `,
    }) as any,
}

export const NoUser: Story = {
  render: () =>
    ({
      components: { ClAvatarMenuMock },
      setup() {
        return {
          user: null,
        }
      },
      template: `
      <div class="p-8 flex justify-end">
        <ClAvatarMenuMock :user="user" />
      </div>
    `,
    }) as any,
}

export const InHeaderContext: Story = {
  render: () =>
    ({
      components: { ClAvatarMenuMock },
      setup() {
        return {
          user: mockUser,
        }
      },
      template: `
      <div class="bg-header-default border-b border-header-default px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <h1 class="text-lg font-semibold text-header-default">Chase Light</h1>
          </div>
          <div class="flex items-center gap-3">
            <ClAvatarMenuMock :user="user" />
          </div>
        </div>
      </div>
    `,
    }) as any,
}

export const InteractionDemo: Story = {
  render: () =>
    ({
      components: { ClAvatarMenuMock },
      setup() {
        return {
          user: mockUser,
        }
      },
      template: `
      <div class="space-y-6">
        <div class="p-4 border rounded-lg">
          <h3 class="mb-4 text-lg font-medium text-content-default">操作方法</h3>
          <ul class="text-sm text-content-default space-y-2">
            <li>• アバターをクリックしてメニューを開く</li>
            <li>• Escキーでメニューを閉じる</li>
            <li>• メニュー外をクリックしてメニューを閉じる</li>
            <li>• プロフィール/ログアウトボタンをクリック</li>
          </ul>
        </div>
        <div class="p-8 flex justify-end border rounded-lg">
          <ClAvatarMenuMock :user="user" />
        </div>
      </div>
    `,
    }) as any,
}
