<script setup lang="ts">
import ClCheckbox from '~/components/base/ClCheckbox.vue'
import ClModalDialog from '~/components/base/ClModalDialog.vue'
import {
  useAddDataSourceModal,
  type FormState,
} from './use-add-data-source-modal'

interface Props {
  open: boolean
  initialValues?: Partial<FormState>
}

const props = withDefaults(defineProps<Props>(), {
  initialValues: () => ({}),
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
  (e: 'error', message: string): void
}>()

const {
  form,
  repositoryError,
  submitError,
  isSubmitDisabled,
  isSubmitting,
  resetForm,
  handleSubmit,
  handleCancel,
} = useAddDataSourceModal(props, emit)

defineExpose({
  resetForm,
})
</script>

<template>
  <ClModalDialog
    :open="props.open"
    labelledby="add-data-source-modal-title"
    describedby="add-data-source-modal-description"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="flex flex-col gap-1">
        <h2
          id="add-data-source-modal-title"
          class="text-lg font-semibold text-content-default"
        >
          データソースを追加
        </h2>
      </div>
    </template>

    <form
      id="add-data-source-form"
      class="flex flex-col gap-6 w-xl"
      @submit.prevent="handleSubmit"
    >
      <div class="flex flex-col gap-2">
        <label
          for="repository-url"
          class="text-sm font-medium text-content-default"
        >
          リポジトリ URL
        </label>
        <input
          id="repository-url"
          v-model="form.repositoryUrl"
          name="repositoryUrl"
          placeholder="https://github.com/owner/repo"
          class="w-full rounded-md border border-interactive-default/20 bg-interactive-default px-3 py-2 text-sm text-interactive-default shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default"
          :aria-invalid="repositoryError ? 'true' : 'false'"
          autocomplete="off"
        />
        <p v-if="repositoryError" class="text-sm text-status-alert-default">
          {{ repositoryError }}
        </p>
      </div>

      <fieldset class="space-y-3">
        <legend class="text-sm font-medium text-content-default">
          通知設定
        </legend>
        <ClCheckbox
          v-model="form.notificationEnabled"
          :label="'通知を有効にする'"
        />
      </fieldset>

      <fieldset class="">
        <legend class="text-sm font-medium text-content-default">
          監視するアクティビティ
        </legend>
        <div class="flex gap-3 my-3">
          <ClCheckbox v-model="form.watchReleases" :label="'リリース'" />
          <ClCheckbox v-model="form.watchIssues" :label="'Issue'" />
          <ClCheckbox
            v-model="form.watchPullRequests"
            :label="'Pull Request'"
          />
        </div>
      </fieldset>

      <p v-if="submitError" class="text-sm text-status-alert-default">
        {{ submitError }}
      </p>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-md border border-content-default/20 px-4 py-2 text-sm font-medium text-content-default transition hover:bg-surface-secondary-hovered focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default"
          @click="handleCancel"
        >
          キャンセル
        </button>
        <button
          type="submit"
          class="rounded-md bg-interactive-default px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-interactive-hovered focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSubmitDisabled"
          form="add-data-source-form"
          data-testid="add-data-source-submit"
        >
          {{ isSubmitting ? '登録中...' : '登録する' }}
        </button>
      </div>
    </template>
  </ClModalDialog>
</template>
