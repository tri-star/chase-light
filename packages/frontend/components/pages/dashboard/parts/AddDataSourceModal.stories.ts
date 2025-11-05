import type { Meta, StoryObj } from '@nuxtjs/storybook'
import { ref } from 'vue'
import AddDataSourceModal from './AddDataSourceModal.vue'

const meta: Meta<typeof AddDataSourceModal> = {
  title: 'Components/Pages/Dashboard/AddDataSourceModal',
  component: AddDataSourceModal,
  args: {
    open: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof AddDataSourceModal>

export const Default: Story = {
  render: (args) => ({
    components: { AddDataSourceModal },
    setup() {
      const open = ref(true)
      const handleSuccess = () => {
        open.value = false
      }
      return { args, open, handleSuccess }
    },
    template: `
      <AddDataSourceModal
        v-model:open="open"
        v-bind="args"
        @success="handleSuccess"
      />
    `,
  }),
}

export const WithError: Story = {
  render: (args) => ({
    components: { AddDataSourceModal },
    setup() {
      const open = ref(true)
      const initialValues = {
        repositoryUrl: 'https://example.com/invalid',
      }
      return { args, open, initialValues }
    },
    template: `
      <AddDataSourceModal
        v-model:open="open"
        v-bind="args"
        :initial-values="initialValues"
      />
    `,
  }),
}
