import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import { readFileSync } from "node:fs";

export default defineConfig({
  plugins: [
    {
      name: "inline-raw-files",
      enforce: "pre",
      load(id) {
        const path = id.split("?")[0];
        if (path.endsWith(".sh") || path.endsWith(".ps1")) {
          return `export default ${JSON.stringify(readFileSync(path, "utf-8"))};`;
        }
        if (path.endsWith(".md")) {
          return `export default ${JSON.stringify(readFileSync(path, "utf-8"))};`;
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
