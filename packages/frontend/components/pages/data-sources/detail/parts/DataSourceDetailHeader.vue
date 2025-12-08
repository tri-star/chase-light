<script setup lang="ts">
import ClHeading from '~/components/base/ClHeading.vue'
import type { DataSource } from '~/generated/api/schemas'

defineProps<{
  dataSource: DataSource
}>()
</script>

<template>
  <header class="space-y-3">
    <div class="flex items-center gap-3">
      <Icon
        name="grommet-icons:github"
        class="text-card-title h-6 w-6"
        aria-hidden="true"
      />
      <ClHeading :level="1" class="text-2xl text-card-title font-bold">
        {{ dataSource.name }}
      </ClHeading>
    </div>
    <a
      :href="dataSource.url"
      class="text-sm text-link-default inline-flex items-center gap-2
        underline-offset-4 transition hover:underline"
      target="_blank"
      rel="noreferrer noopener"
    >
      <span>{{ dataSource.url }}</span>
      <Icon
        name="heroicons:arrow-top-right-on-square"
        class="h-4 w-4"
        aria-hidden="true"
      />
    </a>
  </header>
</template>
