import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import ClSpinner from '../ClSpinner.vue'

describe('ClSpinner', () => {
  test('デフォルトのaria-labelが設定される', () => {
    const wrapper = mount(ClSpinner)

    const spinner = wrapper.get('[data-testid="cl-spinner"]')
    expect(spinner.attributes('aria-label')).toBe('読み込み中')
  })

  test('サイズに応じたクラスが適用される', () => {
    const wrapper = mount(ClSpinner, {
      props: { size: 'lg' },
    })

    const classes = wrapper.get('[data-testid="cl-spinner"]').classes()
    expect(classes).toContain('h-8')
    expect(classes).toContain('w-8')
  })

  test('variantに応じてクラスが切り替わる', () => {
    const wrapper = mount(ClSpinner, {
      props: { variant: 'secondary' },
    })

    const classes = wrapper.get('[data-testid="cl-spinner"]').classes()
    expect(classes).toContain('border-surface-secondary-default')
  })
})
