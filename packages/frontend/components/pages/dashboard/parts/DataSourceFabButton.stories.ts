import type { Meta, StoryObj } from '@nuxtjs/storybook'
import DataSourceFabButton from './DataSourceFabButton.vue'

const meta: Meta<typeof DataSourceFabButton> = {
  title: 'Components/Pages/Dashboard/DataSourceFabButton',
  component: DataSourceFabButton,
  args: {
    label: 'データソースを追加',
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof DataSourceFabButton>

export const Default: Story = {
  render: (args) => ({
    components: { DataSourceFabButton },
    setup() {
      return { args }
    },
    template: `
      <div class="relative h-[480px] bg-surface-secondary-default">
        <DataSourceFabButton v-bind="args" />
      </div>
    `,
  }),
}
