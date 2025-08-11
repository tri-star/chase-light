# Repository Guidelines

## Project Structure & Module Organization

- Monorepo managed by `pnpm` workspaces under `packages/`:
  - `packages/frontend/`: Nuxt 3 app (Vue, Tailwind, Storybook).
  - `packages/backend/`: Hono API + Drizzle ORM, AWS Lambda friendly build.
  - `packages/shared/`: Reusable TypeScript utilities and types.
- Docs live in `docs/` (ADR, quickstart, deployment). Env samples: `.env.example` in root and each package.

## Build, Test, and Development Commands

- Build all: `pnpm build` (runs package builds recursively).
- Dev servers: `pnpm dev:frontend` (Nuxt) and `pnpm dev:backend` (Hono).
- Unit tests: `pnpm test` (runs frontend and backend). Per-package:
  - Frontend: `pnpm --filter frontend test` | E2E: `pnpm --filter frontend test:e2e`.
  - Backend: `pnpm --filter backend test` | Coverage: `pnpm --filter backend test:coverage`.
- Lint/format: `pnpm lint`, `pnpm lint:type`, `pnpm format`.

## Coding Style & Naming Conventions

- Language: TypeScript across packages. Indent 2 spaces, LF line endings.
- Formatting: Biome for backend/shared (`biome.json`); Prettier for frontend (`.prettierrc`, semi: false, single quotes).
- ESLint: enabled in all packages; treat unused vars prefixed with `_` as intentional.
- Files: keep feature-oriented structure (e.g., `packages/backend/src/routes/users.ts`, `packages/frontend/components/UserCard.vue`). Prefer kebab-case for filenames, PascalCase for Vue components, camelCase for variables/functions, PascalCase for types.

## Testing Guidelines

- Frameworks: Vitest for unit tests; Playwright for frontend E2E.
- Location: co-locate tests near source or under `tests/` when clearer.
- Conventions: name tests `*.spec.ts`/`*.test.ts`. Backend tests may require DB setup; use `pnpm --filter backend test:migrate` (auto-run by `test`).

## Commit & Pull Request Guidelines

- Commit style: Conventional Commits preferred (feat, fix, chore, docs). Include scope when helpful (e.g., `feat(frontend): ...`) and ticket when available (e.g., `feat(CHASE-92): ...`).
- PRs: include clear description, linked issue, test plan, and screenshots for UI changes. Ensure CI passes and run `pnpm lint && pnpm test` before requesting review.

## Security & Configuration

- Do not commit secrets. Copy and edit `.env.example` files locally (`cp packages/backend/.env.example packages/backend/.env`).
- Backend local helpers: `pnpm --filter backend local:start|local:stop` to manage local dependencies.

## Git コミット時の注意点

- コミットする時、コミット内容・粒度はconventional commitを意識して書いてください。
- git commit --author="Codex CLI <Email address>" でCodex CLIをコミッターとして指定してください。
- コミットメッセージは日本語でお願いします。
- PlaneのWorkItemに紐づくタスクに取り組んでいる時は、以下も意識してください。
  - コミットメッセージにPlaneの課題IDを含めてください(CHASE-XXX)。
  - Planeのタスクを更新して、作業内容を反映させてください。
- コミット前に以下を実行し、エラーがある場合は調査、修正案を検討し、修正を行ってください。
  - format
  - lint
  - test
