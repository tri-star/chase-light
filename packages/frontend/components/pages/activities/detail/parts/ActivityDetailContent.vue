<script setup lang="ts">
import { computed } from 'vue'
import ClHeading from '~/components/base/ClHeading.vue'
import ClIconButton from '~/components/base/ClIconButton.vue'

const props = defineProps<{
  title: string
  body: string
  mode: 'translated' | 'original'
  hasTranslatedContent: boolean
}>()

const modeLabel = computed(() =>
  props.mode === 'translated' && props.hasTranslatedContent
    ? '翻訳結果'
    : '原文'
)
</script>

<template>
  <section class="space-y-4">
    <div
      class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
    >
      <div class="space-y-2">
        <div class="text-xs tracking-wide text-card-value uppercase opacity-60">
          {{ modeLabel }}
        </div>
        <ClHeading :level="1" class="text-2xl text-card-title">
          {{ props.title }}
        </ClHeading>
      </div>

      <div
        class="flex items-center gap-2 rounded-full
          bg-surface-secondary-default/60 p-2"
        data-testid="activity-actions"
      >
        <ClIconButton
          aria-label="共有する"
          icon="i-heroicons-share-20-solid"
          size="sm"
        />
        <ClIconButton
          aria-label="保存する"
          icon="i-heroicons-bookmark-20-solid"
          size="sm"
        />
        <ClIconButton
          aria-label="いいねする"
          icon="i-heroicons-hand-thumb-up-20-solid"
          size="sm"
        />
      </div>
    </div>

    <div
      class="rounded-lg border border-surface-secondary-default
        bg-surface-secondary-default/50 p-4"
    >
      <p
        data-testid="activity-body"
        class="text-sm leading-relaxed whitespace-pre-wrap text-card-value"
      >
        {{ props.body }}
      </p>
    </div>
  </section>
</template>
