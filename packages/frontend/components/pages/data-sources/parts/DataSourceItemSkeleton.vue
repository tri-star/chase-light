<script setup lang="ts"></script>

<template>
  <div class="space-y-4">
    <div
      class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <!-- データソース名のスケルトン -->
      <div
        class="rounded h-5 w-48 animate-pulse bg-surface-secondary-default"
      ></div>
      <!-- ウォッチ状態バッジのスケルトン -->
      <div class="flex gap-2">
        <div
          class="rounded h-6 w-16 animate-pulse bg-surface-secondary-default"
        ></div>
        <div
          class="rounded h-6 w-16 animate-pulse bg-surface-secondary-default"
        ></div>
        <div
          class="rounded h-6 w-16 animate-pulse bg-surface-secondary-default"
        ></div>
      </div>
    </div>
    <div class="space-y-2">
      <!-- descriptionのスケルトン -->
      <div
        class="rounded h-4 w-full animate-pulse bg-surface-secondary-default"
      ></div>
      <div
        class="rounded h-4 w-3/4 animate-pulse bg-surface-secondary-default"
      ></div>
    </div>
    <div class="flex items-center gap-4">
      <!-- スター数のスケルトン -->
      <div
        class="rounded h-4 w-20 animate-pulse bg-surface-secondary-default"
      ></div>
    </div>
  </div>
</template>
