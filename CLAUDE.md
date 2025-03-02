# Chase Light Commands and Style Guide

## Commands
- **Development**: `pnpm dev` (runs both API and app)
- **API Development**: `pnpm dev:api` (starts Docker and runs API server)
- **App Development**: `pnpm dev:app` (runs Nuxt dev server)
- **Testing**: `pnpm test` (in packages/api or packages/app)
- **Single Test**: `pnpm test path/to/test.ts` or `pnpm test -t "test description"`
- **Linting**: `pnpm lint` (runs eslint, type checking, and biome)
- **Formatting**: `pnpm format` (API) or `pnpm format:biome && pnpm format:prettier` (App)

## Style Guidelines
- **Imports**: Single quotes, no semicolons (except where needed)
- **Formatting**: 2-space indentation (enforced by Biome)
- **Types**: Strong typing with TypeScript, unused vars with _ prefix are allowed
- **Testing**: Vitest with describe/test structure and descriptive Japanese test names
- **Error Handling**: Structured error classes in src/errors
- **Architecture**: Domain-driven design with features/ directory structure
- **Components**: Vue components with composition API, use Nuxt conventions