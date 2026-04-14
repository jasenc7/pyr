const PAGES = [
  { href: "/docs", title: "docs" },
  { href: "/app-convention", title: "app convention" },
];

// Version is pulled from the root repo's deno.json at build time (inlined
// into the bundle). Same repo, single source of truth.
import rootConfig from "../../deno.json" with { type: "json" };
const VERSION: string = rootConfig.version;

interface Props {
  html: string;
  href: string;
}

export default function DocLayout({ html, href }: Props) {
  const toc: { id: string; text: string; level: 2 | 3 }[] = [];
  const re = /<h([23])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    toc.push({
      level: Number(m[1]) as 2 | 3,
      id: m[2],
      text: m[3].replace(/<[^>]+>/g, "").trim(),
    });
  }

  return (
    <div class="docs-shell">
      <aside class="docs-sidebar">
        <p class="docs-version">v{VERSION}</p>
        <p class="docs-sidebar-label">guide</p>
        <ul class="docs-nav">
          {PAGES.map((p) => (
            <li>
              <a
                href={p.href}
                class={
                  p.href === href ? "docs-nav-link active" : "docs-nav-link"
                }
              >
                {p.title}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <main class="docs-main">
        <article
          class="markdown-body"
          data-color-mode="auto"
          data-light-theme="light"
          data-dark-theme="dark"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>

      <aside class="docs-toc">
        {toc.length > 0 && (
          <>
            <p class="docs-sidebar-label">on this page</p>
            <ul class="docs-toc-list">
              {toc.map((t) => (
                <li class={t.level === 3 ? "docs-toc-sub" : ""}>
                  <a href={`#${t.id}`}>{t.text}</a>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  );
}
