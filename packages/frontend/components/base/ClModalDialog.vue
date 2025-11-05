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
    class="z-[1200] w-full max-w-lg rounded-2xl border border-dialog-default bg-dialog-default text-dialog-default shadow-2xl focus-visible:outline-none"
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
        class="absolute right-4 top-4 rounded-md p-2 text-content-default/70 transition hover:text-content-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default"
        :aria-label="props.closeButtonLabel"
        data-testid="modal-close-button"
        @click="onDismissClick"
      >
        <span class="i-heroicons-x-mark-20-solid h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </dialog>
</template>

<style scoped>
dialog::backdrop {
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
}
</style>
