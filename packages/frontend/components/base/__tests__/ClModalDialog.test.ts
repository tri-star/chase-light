import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import ClModalDialog from '../ClModalDialog.vue'

const originalShowModal = HTMLDialogElement.prototype.showModal
const originalClose = HTMLDialogElement.prototype.close

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
  }
})

describe('ClModalDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('opens when bound value becomes true', async () => {
    const Wrapper = defineComponent({
      components: { ClModalDialog },
      setup() {
        const isOpen = ref(false)
        return { isOpen }
      },
      template: `
        <ClModalDialog v-model:open="isOpen">
          <p>内容</p>
        </ClModalDialog>
      `,
    })

    const wrapper = mount(Wrapper)
    wrapper.vm.isOpen = true
    await nextTick()

    const dialog = wrapper.findComponent(ClModalDialog).find('dialog')
    expect(dialog.element.hasAttribute('open')).toBe(true)
  })

  it('emits update event when close button clicked', async () => {
    const wrapper = mount(ClModalDialog, {
      props: {
        open: true,
      },
    })

    await nextTick()

    await wrapper.get('[data-testid="modal-close-button"]').trigger('click')

    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })

  it('closes when cancel event fires and dismissible is true', async () => {
    const wrapper = mount(ClModalDialog, {
      props: {
        open: true,
      },
    })

    await nextTick()

    const dialog = wrapper.get('dialog')
    dialog.element.dispatchEvent(new Event('cancel', { cancelable: true }))

    expect(wrapper.emitted('update:open')).toBeTruthy()
  })

  it('ignores cancel when dismissible is false', async () => {
    const wrapper = mount(ClModalDialog, {
      props: {
        open: true,
        dismissible: false,
      },
    })

    await nextTick()

    const dialog = wrapper.get('dialog')
    dialog.element.dispatchEvent(new Event('cancel', { cancelable: true }))

    expect(wrapper.emitted('update:open')).toBeFalsy()
    expect(dialog.element.hasAttribute('open')).toBe(true)
  })
})

afterAll(() => {
  HTMLDialogElement.prototype.showModal = originalShowModal
  HTMLDialogElement.prototype.close = originalClose
})
