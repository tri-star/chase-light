import type { Meta, StoryObj } from '@nuxtjs/storybook'
import DashboardStatCard from './DashboardStatCard.vue'

const meta: Meta<typeof DashboardStatCard> = {
  title: 'Components/Pages/Dashboard/DashboardStatCard',
  component: DashboardStatCard,
  args: {
    label: 'ウォッチ中リポジトリ',
    value: 18,
    icon: 'i-heroicons-eye-20-solid',
    iconClass: 'text-surface-primary-default',
  },
  parameters: {
    docs: {
      description: {
        component:
          'ダッシュボードで統計情報を表示するためのカードコンポーネント。アイコンの表示有無、ラベル/値、無効状態を切り替えできます。',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithoutIcon: Story = {
  args: {
    icon: undefined,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const WithSuffix: Story = {
  render: (args) => ({
    components: { DashboardStatCard },
    setup: () => ({ args }),
    template: `
      <DashboardStatCard v-bind="args">
        <template #suffix>
          <span class="text-sm text-card-label">件</span>
        </template>
      </DashboardStatCard>
    `,
  }),
}

export const CustomIconColor: Story = {
  args: {
    iconClass: 'text-status-info-default',
    icon: 'i-heroicons-information-circle-20-solid',
    value: '8',
    label: '未読通知',
  },
}
