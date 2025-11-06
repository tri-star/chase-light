<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import ClCheckbox from '~/components/base/ClCheckbox.vue'
import ClModalDialog from '~/components/base/ClModalDialog.vue'
import { useToast } from '~/composables/use-toast'
import { isGitHubRepositoryUrl } from 'shared'

interface FormState {
  repositoryUrl: string
  notificationEnabled: boolean
  watchReleases: boolean
  watchIssues: boolean
  watchPullRequests: boolean
}

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

const toast = useToast()

const defaultValues: FormState = {
  repositoryUrl: '',
  notificationEnabled: true,
  watchReleases: true,
  watchIssues: true,
  watchPullRequests: true,
}

const form = reactive<FormState>({
  repositoryUrl: '',
  notificationEnabled: true,
  watchReleases: true,
  watchIssues: true,
  watchPullRequests: true,
})

const repositoryError = ref<string | null>(null)
const submitError = ref<string | null>(null)
const isSubmitting = ref(false)

const trimmedRepositoryUrl = computed(() => form.repositoryUrl.trim())

const isRepositoryUrlValid = computed(() =>
  trimmedRepositoryUrl.value
    ? isGitHubRepositoryUrl(trimmedRepositoryUrl.value)
    : false
)

const isSubmitDisabled = computed(
  () => isSubmitting.value || !trimmedRepositoryUrl.value
)

const resetForm = () => {
  Object.assign(form, {
    ...defaultValues,
    ...props.initialValues,
  })
  repositoryError.value = null
  submitError.value = null

  if (form.repositoryUrl && !isGitHubRepositoryUrl(form.repositoryUrl)) {
    repositoryError.value =
      'https://github.com/{owner}/{repo} の形式で入力してください。'
  }
}

const handleValidation = () => {
  repositoryError.value = null

  if (!trimmedRepositoryUrl.value) {
    repositoryError.value = 'GitHub リポジトリのURLを入力してください。'
    return false
  }

  if (!isRepositoryUrlValid.value) {
    repositoryError.value =
      'https://github.com/{owner}/{repo} の形式で入力してください。'
    return false
  }

  return true
}

const extractErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: Record<string, unknown> }).data
    if (data && typeof data.validationError === 'string') {
      return data.validationError
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'データソースの登録に失敗しました。時間をおいて再度お試しください。'
}

const handleSubmit = async () => {
  if (isSubmitting.value) {
    return
  }

  submitError.value = null

  if (!handleValidation()) {
    return
  }

  isSubmitting.value = true

  try {
    await $fetch('/api/data-sources', {
      method: 'POST',
      body: {
        repositoryUrl: trimmedRepositoryUrl.value,
        notificationEnabled: form.notificationEnabled,
        watchReleases: form.watchReleases,
        watchIssues: form.watchIssues,
        watchPullRequests: form.watchPullRequests,
      },
    })

    toast.showToast({
      intent: 'success',
      title: 'データソースを追加しました',
      message: `${trimmedRepositoryUrl.value} を監視対象に登録しました。`,
    })

    emit('success')
    emit('update:open', false)
    resetForm()
  } catch (error) {
    const message = extractErrorMessage(error)
    submitError.value = message

    toast.showToast({
      intent: 'alert',
      title: 'データソースの追加に失敗しました',
      message,
      duration: null,
    })

    emit('error', message)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('update:open', false)
}

watch(
  () => form.repositoryUrl,
  () => {
    if (repositoryError.value) {
      repositoryError.value = null
    }
    if (submitError.value) {
      submitError.value = null
    }
  }
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  }
)

onMounted(() => {
  if (props.open) {
    resetForm()
  }
})

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
        <p
          id="add-data-source-modal-description"
          class="text-sm text-content-default/80"
        >
          GitHub
          リポジトリを監視対象に登録し、アクティビティの通知を受け取ります。
        </p>
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
        <input
          id="repository-url"
          v-model="form.repositoryUrl"
          type="url"
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
