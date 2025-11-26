<template>
  <div class="flex flex-col gap-8 bg-content-default p-8">
    <h1 class="text-2xl font-bold">Font Utility Classes Test</h1>

    <section>
      <h2 class="text-xl mb-4 font-semibold">Font Scale Utilities</h2>
      <div class="flex flex-col gap-2">
        <div class="font-scale-xs">
          font-scale-xs: The quick brown fox jumps
        </div>
        <div class="font-scale-sm">
          font-scale-sm: The quick brown fox jumps
        </div>
        <div class="font-scale-base">
          font-scale-base: The quick brown fox jumps
        </div>
        <div class="font-scale-lg">
          font-scale-lg: The quick brown fox jumps
        </div>
        <div class="font-scale-xl">
          font-scale-xl: The quick brown fox jumps
        </div>
        <div class="font-scale-2xl">
          font-scale-2xl: The quick brown fox jumps
        </div>
        <div class="font-scale-3xl">
          font-scale-3xl: The quick brown fox jumps
        </div>
        <div class="font-scale-4xl">
          font-scale-4xl: The quick brown fox jumps
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-xl mb-4 font-semibold">Font Semantic Utilities</h2>
      <div class="flex flex-col gap-2">
        <h1 class="font-semantic-heading-1">
          font-semantic-heading-1: The quick brown fox jumps
        </h1>
        <h2 class="font-semantic-heading-2">
          font-semantic-heading-2: The quick brown fox jumps
        </h2>
        <h3 class="font-semantic-heading-3">
          font-semantic-heading-3: The quick brown fox jumps
        </h3>
        <h4 class="font-semantic-heading-4">
          font-semantic-heading-4: The quick brown fox jumps
        </h4>
        <p class="font-semantic-body">
          font-semantic-body: The quick brown fox jumps over the lazy dog. This
          is a sample paragraph to test the body text styling.
        </p>
        <p class="font-semantic-body-sm">
          font-semantic-body-sm: The quick brown fox jumps over the lazy dog.
          This is a smaller body text example.
        </p>
        <p class="font-semantic-caption">
          font-semantic-caption: Caption text example - smaller than body text
        </p>
        <code class="font-semantic-code">
          font-semantic-code: const example = 'monospace font';
        </code>
      </div>
    </section>

    <section>
      <h2 class="text-xl mb-4 font-semibold">Mixed Usage Example</h2>
      <div class="flex flex-col gap-4">
        <div class="text-surface-primary-default font-semantic-heading-3">
          Styled Heading with Color
        </div>
        <p class="text-card-value font-semantic-body">
          Body text with custom color applied alongside the font utility class.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'guest',
})
</script>
