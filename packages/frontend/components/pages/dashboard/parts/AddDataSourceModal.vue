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
  repositoryFieldValidators,
  submitError,
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
    class="w-sm md:w-xl"
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
      class="flex flex-col gap-6"
      @submit.prevent="handleSubmit"
    >
      <div class="flex flex-col gap-2">
        <label
          for="repository-url"
          class="text-sm font-medium text-content-default"
        >
          リポジトリ URL
        </label>
        <form.Field
          name="repositoryUrl"
          :validators="repositoryFieldValidators"
        >
          <template #default="{ field }">
            <input
              id="repository-url"
              :name="field.name"
              :value="field.state.value"
              placeholder="https://github.com/owner/repo"
              class="focus-visible:ring-status-focus-default text-sm w-full
                rounded-md border border-interactive-default/20
                bg-interactive-default px-3 py-2 text-interactive-default
                shadow-sm focus-visible:ring-2 focus-visible:outline-none"
              :aria-invalid="field.state.meta.errors?.length ? 'true' : 'false'"
              autocomplete="off"
              @input="
                field.handleChange(($event.target as HTMLInputElement).value)
              "
              @blur="field.handleBlur"
            />
            <p
              v-if="field.state.meta.errors?.length"
              class="text-sm text-status-alert-default"
            >
              {{ field.state.meta.errors[0] }}
            </p>
          </template>
        </form.Field>
      </div>

      <fieldset class="">
        <legend class="text-sm font-medium text-content-default">
          監視するアクティビティ
        </legend>
        <div class="my-3 flex flex-col gap-3 md:flex-row">
          <form.Field name="watchReleases">
            <template #default="{ field }">
              <ClCheckbox
                :model-value="field.state.value"
                :label="'リリース'"
                @update:model-value="
                  (value) => field.handleChange(value as boolean)
                "
              />
            </template>
          </form.Field>
          <form.Field name="watchIssues">
            <template #default="{ field }">
              <ClCheckbox
                :model-value="field.state.value"
                :label="'Issue'"
                @update:model-value="
                  (value) => field.handleChange(value as boolean)
                "
              />
            </template>
          </form.Field>
          <form.Field name="watchPullRequests">
            <template #default="{ field }">
              <ClCheckbox
                :model-value="field.state.value"
                :label="'Pull Request'"
                @update:model-value="
                  (value) => field.handleChange(value as boolean)
                "
              />
            </template>
          </form.Field>
        </div>
      </fieldset>

      <p v-if="submitError" class="text-sm text-status-alert-default">
        {{ submitError }}
      </p>
    </form>

    <template #footer>
      <form.Subscribe
        :selector="
          (state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })
        "
      >
        <template #default="{ canSubmit, isSubmitting }">
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="border-content-default/20
                focus-visible:ring-status-focus-default text-sm rounded-md
                border px-4 py-2 font-medium text-content-default transition
                hover:bg-surface-secondary-hovered focus-visible:ring-2
                focus-visible:outline-none"
              @click="handleCancel"
            >
              キャンセル
            </button>
            <button
              type="submit"
              class="focus-visible:ring-status-focus-default text-sm text-white
                shadow rounded-md bg-interactive-default px-4 py-2 font-medium
                transition hover:bg-interactive-hovered focus-visible:ring-2
                focus-visible:outline-none disabled:cursor-not-allowed
                disabled:opacity-60"
              :disabled="!canSubmit"
              form="add-data-source-form"
              data-testid="add-data-source-submit"
            >
              {{ isSubmitting ? '登録中...' : '登録する' }}
            </button>
          </div>
        </template>
      </form.Subscribe>
    </template>
  </ClModalDialog>
</template>
