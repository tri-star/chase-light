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
          'ユーザーアバターとドロップダウンメニューコンポーネントです。プロフィール表示、プロフィール編集、ログアウト機能を提供します。新しいClDropdownMenuとClMenuItemベースで実装されています。',
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

// useAuthのモックを含むラッパーコンポーネント
const ClAvatarMenuWrapper = {
  components: { ClAvatarMenu },
  props: {
    user: {
      type: Object,
      default: null,
    },
  },
  setup(props: { user: typeof mockUser | null }) {
    // useAuthのモック
    const useAuth = () => ({
      user: computed(() => props.user),
      logout: async () => {
        console.log('Logout clicked (Storybook mock)')
      },
    })

    // グローバルに提供
    ;(globalThis as any).useAuth = useAuth

    return {
      user: computed(() => props.user),
    }
  },
  template: `
    <div class="p-8 flex justify-end">
      <ClAvatarMenu />
    </div>
  `,
}

export const WithAvatar: Story = {
  render: () =>
    ({
      components: { ClAvatarMenuWrapper },
      setup() {
        return {
          user: mockUser,
        }
      },
      template: `
      <ClAvatarMenuWrapper :user="user" />
    `,
    }) as any,
}

export const WithoutAvatar: Story = {
  render: () =>
    ({
      components: { ClAvatarMenuWrapper },
      setup() {
        return {
          user: mockUserNoAvatar,
        }
      },
      template: `
      <ClAvatarMenuWrapper :user="user" />
    `,
    }) as any,
}

export const NoUser: Story = {
  render: () =>
    ({
      components: { ClAvatarMenuWrapper },
      setup() {
        return {
          user: null,
        }
      },
      template: `
      <ClAvatarMenuWrapper :user="user" />
    `,
    }) as any,
}

export const InHeaderContext: Story = {
  render: () =>
    ({
      components: { ClAvatarMenuWrapper },
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
            <ClAvatarMenuWrapper :user="user" />
          </div>
        </div>
      </div>
    `,
    }) as any,
}

export const InteractionDemo: Story = {
  render: () =>
    ({
      components: { ClAvatarMenuWrapper },
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
            <li>• キーボードの↓↑キーでメニュー項目を移動</li>
            <li>• Enterキーで選択</li>
            <li>• プロフィール/ログアウトボタンをクリック</li>
          </ul>
        </div>
        <div class="p-8 flex justify-end border rounded-lg">
          <ClAvatarMenuWrapper :user="user" />
        </div>
      </div>
    `,
    }) as any,
}
