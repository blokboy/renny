import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Minimal Vitest setup (issue #7 is the first module in this repo to ship
 * unit tests — no runner/config existed before this). It still runs pure TS
 * modules in Node, but issue #8/#10 modules now import through the repo's
 * `@/*` path alias, so Vitest mirrors `tsconfig.json` here.
 * Add `@vitejs/plugin-react` + `environment: "jsdom"` (and a path-alias
 * plugin, if `@/*` imports are needed) per Next.js's own Vitest guide
 * (`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`) if/when
 * a future issue needs to unit-test a component.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
  },
});
