import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DataSourceFabButton from '../DataSourceFabButton.vue'

describe('DataSourceFabButton', () => {
  it('renders with default label', () => {
    const wrapper = mount(DataSourceFabButton)

    expect(
      wrapper.find('[data-testid="fab-button"]').attributes('aria-label')
    ).toBe('データソースを追加')
  })

  it('emits click event when pressed', async () => {
    const wrapper = mount(DataSourceFabButton)

    await wrapper.get('[data-testid="fab-button"]').trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
