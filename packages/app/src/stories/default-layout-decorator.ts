export const defaultLayoutDecorator = () => ({
  template: `<Suspense><main class="flex h-full justify-center p-4">
    <div
      class="bg-default flex flex-col rounded-2xl p-4 md:w-[600px] lg:w-[800px]">
      <story/>
    </div>
  </main></Suspense>`,
})
