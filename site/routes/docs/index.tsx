import { Head } from "$fresh/runtime.ts";
import { CSS, render } from "$gfm";

const md = await Deno.readTextFile(
  new URL("../../docs/index.md", import.meta.url),
);
const html = render(md, { baseUrl: "https://pyrun.dev/docs" });

export default function Docs() {
  return (
    <>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </Head>

      <nav class="nav">
        <a class="nav-logo" href="/">pyrun</a>
        <div class="nav-right">
          <a class="nav-link" href="/docs">docs</a>
          <a
            class="nav-link"
            href="https://github.com/jasenc7/pyr"
            target="_blank"
            rel="noopener"
          >
            github
          </a>
        </div>
      </nav>

      <main class="docs-wrap">
        <article
          class="markdown-body"
          data-color-mode="auto"
          data-light-theme="light"
          data-dark-theme="dark"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>

      <footer class="footer">
        <span>pyrun.dev</span>
        <span>by jasencarroll</span>
      </footer>
    </>
  );
}
