<script setup lang="ts">
import { computed, useSlots } from 'vue'
import ClSection from '~/components/base/ClSection.vue'

interface Props {
  name: string
  icon?: string
  iconClass?: string
  label: string
  value: string | number
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  iconClass: 'text-surface-primary-default',
})

export type DashboardStatCardProps = Props

const slots = useSlots()

const hasIcon = computed(() => Boolean(props.icon) || Boolean(slots.icon))
</script>

<template>
  <ClSection class="flex justify-center gap-4 rounded-lg">
    <div
      v-if="hasIcon"
      class="flex flex-shrink-0 items-center justify-center rounded-md"
    >
      <slot name="icon">
        <Icon
          v-if="props.icon"
          :name="props.icon"
          :class="props.iconClass"
          aria-hidden="true"
          size="40"
        />
      </slot>
    </div>

    <div class="min-w-0">
      <dt
        class="text-sm text-card-label line-clamp-2"
        :title="props.label"
        :data-testid="`stat-label-${props.name}`"
      >
        {{ props.label }}
      </dt>
      <dd class="mt-2 flex justify-center items-baseline gap-2">
        <p class="text-2xl font-semibold text-card-value">
          {{ props.value }}
        </p>
        <slot name="suffix" />
      </dd>
    </div>
  </ClSection>
</template>
