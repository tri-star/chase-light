<template>
  <div class="flex flex-col gap-8 bg-content-default">
    <ClHeading :level="2">プロフィール</ClHeading>
    <ClSection>
      <div class="px-4 py-6 sm:px-0">
        <div class="">
          <div class="bg-white shadow rounded-lg">
            <div class="flex flex-col gap-6 px-4">
              <div v-if="user?.avatar" class="mt-6">
                <img
                  :src="user.avatar"
                  :alt="user.name"
                  class="h-24 w-24 rounded-full"
                />
              </div>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label class="text-sm block font-medium text-card-label">
                    Name
                  </label>
                  <div class="text-sm mt-1 text-card-value">
                    {{ user?.name || 'N/A' }}
                  </div>
                </div>

                <div>
                  <label class="text-sm block font-medium text-card-label">
                    Email
                  </label>
                  <div class="text-sm mt-1 text-card-value">
                    {{ user?.email || 'N/A' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClSection>
  </div>
</template>

<script setup>
import ClHeading from '~/components/base/ClHeading.vue'
import ClSection from '~/components/base/ClSection.vue'

definePageMeta({
  middleware: 'auth',
})

const { user } = useAuth()

const loading = ref(false)
</script>
