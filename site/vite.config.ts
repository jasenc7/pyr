import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import { readFileSync } from "node:fs";

export default defineConfig({
  plugins: [
    // Inline any `.md` import as a default-exported string.
    {
      name: "md-as-string",
      transform(_code, id) {
        if (id.endsWith(".md")) {
          return {
            code: `export default ${JSON.stringify(readFileSync(id, "utf-8"))};`,
            map: null,
          };
        }
      },
    },
    fresh(),
  ],
  resolve: {
    dedupe: ["preact", "preact/hooks", "preact/jsx-runtime"],
  },
  ssr: {
    external: ["@deno/gfm", "sanitize-html", "domutils", "entities"],
  },
});
