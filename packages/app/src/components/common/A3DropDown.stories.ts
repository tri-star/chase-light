import type { Meta, StoryObj } from '@storybook/vue3'

import A3DropDown from './A3DropDown.vue'
import { defaultLayoutDecorator } from '~/stories/default-layout-decorator'

const meta = {
  title: 'Components/A3DropDown',
  component: A3DropDown,
  tags: ['autodocs'],
  decorators: [defaultLayoutDecorator],
} satisfies Meta<typeof A3DropDown>

export default meta
type Story = StoryObj<typeof meta>

export const A3DropDownPlaygroundStory: Story = {
  name: 'Playground',
  args: {
    placeholder: '選択してください',
    icon: 'material-symbols:filter-alt',
    value: undefined,
    menus: [
      {
        value: '1',
        label: 'メニュー1',
      },
      {
        value: '2',
        label: 'メニュー2',
      },
      {
        value: '3',
        label: 'メニュー3',
      },
    ],
    disabled: false,
  },
  render: (args) => ({
    components: { A3DropDown },
    setup() {
      return { args }
    },
    template: '<A3DropDown v-bind="args" />',
  }),
}
