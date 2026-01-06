import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ActivityTypeBadge from './ActivityTypeBadge.vue'

const meta = {
  title: 'Common/ActivityTypeBadge',
  component: ActivityTypeBadge,
  tags: ['autodocs'],
  argTypes: {
    activityType: {
      control: 'select',
      options: ['release', 'issue', 'pull_request'],
      description: 'アクティビティの種別',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'バッジのサイズ',
    },
  },
} satisfies Meta<typeof ActivityTypeBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Release: Story = {
  args: {
    activityType: 'release',
    size: 'md',
  },
}

export const Issue: Story = {
  args: {
    activityType: 'issue',
    size: 'md',
  },
}

export const PullRequest: Story = {
  args: {
    activityType: 'pull_request',
    size: 'md',
  },
}

export const SmallSize: Story = {
  args: {
    activityType: 'release',
    size: 'sm',
  },
}

export const AllVariants: Story = {
  args: {
    activityType: 'release',
  },
  render: () => ({
    components: { ActivityTypeBadge },
    template: `
      <div class="space-y-4">
        <div class="space-y-2">
          <h3 class="font-semibold">Medium Size (デフォルト)</h3>
          <div class="flex gap-2">
            <ActivityTypeBadge activity-type="release" />
            <ActivityTypeBadge activity-type="issue" />
            <ActivityTypeBadge activity-type="pull_request" />
          </div>
        </div>
        <div class="space-y-2">
          <h3 class="font-semibold">Small Size</h3>
          <div class="flex gap-2">
            <ActivityTypeBadge activity-type="release" size="sm" />
            <ActivityTypeBadge activity-type="issue" size="sm" />
            <ActivityTypeBadge activity-type="pull_request" size="sm" />
          </div>
        </div>
      </div>
    `,
  }),
}
