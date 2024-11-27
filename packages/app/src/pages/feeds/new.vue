<script setup lang="ts">
import { useForm, type Validator } from "@tanstack/vue-form"
import { zodValidator } from "@tanstack/zod-form-adapter"
import { CYCLE_VALUE_MAP, cycles } from "core/features/feed/feed"
import { routerKey } from "vue-router"
import type { ZodType } from "zod"
import A3Button from "~/components/common/A3Button.vue"
import A3RadioButton from "~/components/common/A3RadioButton.vue"
import A3TextField from "~/components/common/A3TextField.vue"
import { SIDE_MENU_ITEM_MAP } from "~/components/common/side-menu/side-menu"
import {
  createFeedFormSchema,
  type CreateFeedForm,
} from "~/features/feed/domain/feed"

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.feeds.id,
})

const toastStore = useToastStore()
const router = useRouter()
const form = useForm<CreateFeedForm, Validator<unknown, ZodType>>({
  defaultValues: {
    name: "",
    url: "",
    cycle: CYCLE_VALUE_MAP.DAILY,
  },
  validatorAdapter: zodValidator(),
  onSubmit: async () => {
    toastStore.createToast({
      type: "success",
      message: "フィードを登録しました",
    })
  },
})

const canAutoFillFromUrl = computed(() => {
  const urlField = form.useStore((state) => state.values.url)
  return urlField.value.length > 0
})

function handleSaveClick() {
  form.handleSubmit()
}

function handleCancelClick() {
  router.back()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="flex-1">フィード登録</h1>

    <form
      class="flex flex-col gap-6"
      @submit="
        (e) => {
          e.preventDefault()
          e.stopPropagation()
        }
      "
    >
      <div class="flex flex-col gap-2">
        <label class="text-size-h5 font-heading font-bold">フィード名</label>
        <form.Field
          name="name"
          :validators="{
            onChange: createFeedFormSchema.shape.name,
          }"
        >
          <template v-slot="{ field }">
            <div class="flex flex-col gap-1">
              <div class="flex gap-2 items-center">
                <A3TextField
                  class="flex-1"
                  :name="field.name"
                  :value="field.state.value"
                  :error="field.state.meta.errors.length > 0"
                  @input="
                    (e: Event) =>
                      field.handleChange((e.target as HTMLInputElement).value)
                  "
                />
                <A3Button
                  label="URLから自動入力"
                  :disabled="!canAutoFillFromUrl"
                />
              </div>
              <ul v-if="field.state.meta.errors.length">
                <li
                  v-for="(error, index) in field.state.meta.errors"
                  :key="index"
                  class="text-alert"
                >
                  {{ error }}
                </li>
              </ul>
            </div>
          </template>
        </form.Field>
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-size-h5 font-heading font-bold">URL</label>
        <form.Field
          name="url"
          :validators="{
            onChange: createFeedFormSchema.shape.url,
          }"
        >
          <template v-slot="{ field }">
            <A3TextField
              class="flex-1"
              :name="field.name"
              :value="field.state.value"
              :error="field.state.meta.errors.length > 0"
              @input="
                (e: Event) =>
                  field.handleChange((e.target as HTMLInputElement).value)
              "
            />
            <ul v-if="field.state.meta.errors.length">
              <li
                v-for="(error, index) in field.state.meta.errors"
                :key="index"
                class="text-alert"
              >
                {{ error }}
              </li>
            </ul>
          </template>
        </form.Field>
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-size-h5 font-heading font-bold">通知サイクル</label>
        <div class="flex flex-col gap-2">
          <form.Field name="cycle">
            <template v-slot="{ field }">
              <A3RadioButton
                v-for="cycle in cycles"
                :key="cycle.key"
                :name="field.name"
                :label="cycle.name"
                :value="cycle.value"
                :checked="field.state.value == cycle.value"
                @change="() => field.handleChange(cycle.value as any)"
              />
            </template>
          </form.Field>
        </div>
      </div>
      <div class="flex gap-4 justify-center">
        <form.Subscribe>
          <template v-slot="{ canSubmit, isSubmitting }">
            <A3Button
              label="登録"
              type="primary"
              class="w-40"
              :loading="isSubmitting"
              :disabled="!canSubmit"
              @click="handleSaveClick"
            />
          </template>
        </form.Subscribe>
        <A3Button
          label="キャンセル"
          type="default"
          class="w-40"
          @click="handleCancelClick"
        />
      </div>
    </form>
  </div>
</template>

<style scoped></style>
