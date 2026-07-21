import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";

function maybeTsUrl(specifier, parentURL) {
  const url = new URL(`${specifier}.ts`, parentURL);
  return existsSync(url) ? url.href : null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const absolutePath = resolvePath(process.cwd(), "src", specifier.slice(2));
      const tsUrl = pathToFileURL(`${absolutePath}.ts`).href;
      if (existsSync(new URL(tsUrl))) {
        return { url: tsUrl, shortCircuit: true };
      }
    }

    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !specifier.endsWith(".ts") &&
      !specifier.endsWith(".tsx") &&
      !specifier.endsWith(".js") &&
      !specifier.endsWith(".mjs")
    ) {
      const tsUrl = maybeTsUrl(specifier, context.parentURL);
      if (tsUrl) {
        return { url: tsUrl, shortCircuit: true };
      }
    }

    return nextResolve(specifier, context);
  },
});
