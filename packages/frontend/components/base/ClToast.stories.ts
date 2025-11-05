import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ClToast from './ClToast.vue'

type Story = StoryObj<typeof ClToast>

const meta: Meta<typeof ClToast> = {
  title: 'Components/Base/ClToast',
  component: ClToast,
  argTypes: {
    intent: {
      control: { type: 'select' },
      options: ['info', 'success', 'warn', 'alert'],
    },
  },
  args: {
    title: '保存しました',
    message: 'GitHub リポジトリの登録が完了しました。',
    intent: 'success',
    dismissible: true,
  },
}

export default meta

export const Success: Story = {}

export const Info: Story = {
  args: {
    title: '情報',
    message: '現在のステータスは最新です。',
    intent: 'info',
  },
}

export const Warn: Story = {
  args: {
    title: '警告',
    message: '入力内容を確認してください。',
    intent: 'warn',
  },
}

export const Alert: Story = {
  args: {
    title: 'エラー',
    message: '登録に失敗しました。再度お試しください。',
    intent: 'alert',
  },
}

export const WithoutTitle: Story = {
  args: {
    title: undefined,
    message: 'タイトル無しの例です。',
    intent: 'info',
  },
}
