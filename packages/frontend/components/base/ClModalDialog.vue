<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type UpdateEvent = {
  (event: 'update:open', value: boolean): void
}

interface Props {
  open: boolean
  dismissible?: boolean
  labelledby?: string
  describedby?: string
  closeButtonLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  dismissible: true,
  labelledby: undefined,
  describedby: undefined,
  closeButtonLabel: 'モーダルを閉じる',
})

const emit = defineEmits<UpdateEvent>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const previouslyFocusedElement = ref<HTMLElement | null>(null)

const isClient = () => typeof window !== 'undefined'

const restoreFocus = () => {
  if (isClient()) {
    previouslyFocusedElement.value?.focus()
  }
  previouslyFocusedElement.value = null
}

const closeDialog = () => {
  const dialog = dialogRef.value
  if (!dialog) {
    return
  }

  if (dialog.open) {
    dialog.close()
  }

  restoreFocus()
}

const openDialog = async () => {
  const dialog = dialogRef.value
  if (!dialog || !isClient()) {
    return
  }

  previouslyFocusedElement.value = document.activeElement as HTMLElement | null

  if (typeof dialog.showModal === 'function' && !dialog.open) {
    dialog.showModal()
  }

  await nextTick()
  dialog.focus()
}

const onCancel = (event: Event) => {
  if (!props.dismissible) {
    event.preventDefault()
    return
  }

  event.preventDefault()
  emit('update:open', false)
}

const onClose = () => {
  if (props.open) {
    emit('update:open', false)
  }
  restoreFocus()
}

const onDismissClick = () => {
  emit('update:open', false)
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isClient()) {
      return
    }

    if (isOpen) {
      await openDialog()
    } else {
      closeDialog()
    }
  }
)

onMounted(async () => {
  if (props.open) {
    await openDialog()
  }
})

onBeforeUnmount(() => {
  closeDialog()
})

defineExpose({
  close: () => emit('update:open', false),
})
</script>

<template>
  <dialog
    ref="dialogRef"
    class="shadow-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
      rounded-2xl border border-dialog-default bg-dialog-default
      text-dialog-default shadow-primitive-black backdrop-blur-lg
      backdrop:bg-dialog-backdrop focus-visible:outline-none"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="props.labelledby"
    :aria-describedby="props.describedby"
    tabindex="-1"
    @cancel="onCancel"
    @close="onClose"
  >
    <div class="relative flex flex-col gap-4 p-6">
      <slot name="header" />

      <div class="text-sm text-content-default">
        <slot />
      </div>

      <footer
        v-if="$slots.footer"
        class="flex flex-wrap justify-end gap-3 pt-2"
      >
        <slot name="footer" />
      </footer>

      <button
        v-if="props.dismissible"
        type="button"
        class="focus-visible:ring-status-focus-default absolute top-4 right-4
          rounded-md p-2 text-content-default/70 transition
          hover:text-content-default focus-visible:ring-2
          focus-visible:outline-none"
        :aria-label="props.closeButtonLabel"
        data-testid="modal-close-button"
        @click="onDismissClick"
      >
        <span class="i-heroicons-x-mark-20-solid h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </dialog>
</template>
