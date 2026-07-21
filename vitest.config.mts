import { defineConfig } from "vitest/config";

/**
 * Minimal Vitest setup (issue #7 is the first module in this repo to ship
 * unit tests — no runner/config existed before this). Every target here is a
 * pure TS module under `src/lib/combat`, imported via relative paths (this
 * codebase's own within-folder convention — see `resolve.ts`/`puzzles.ts`),
 * so no `@/*` path-alias resolution or React/jsdom environment is needed.
 * Add `@vitejs/plugin-react` + `environment: "jsdom"` (and a path-alias
 * plugin, if `@/*` imports are needed) per Next.js's own Vitest guide
 * (`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`) if/when
 * a future issue needs to unit-test a component.
 */
export default defineConfig({
  test: {
    environment: "node",
  },
});
