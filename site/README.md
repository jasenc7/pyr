# site

The marketing site and documentation content in this directory are © 2026 Jasen
Carroll. All rights reserved.

The pyr tool itself is MIT licensed. See [LICENSE](../LICENSE) in the repo root.

## Source

A Fresh 2 application built with Vite. It is separate from the CLI and is not
embedded in any release artifact.

| Path                                                  | Serves                                      |
| ----------------------------------------------------- | ------------------------------------------- |
| `routes/index.tsx`                                    | `/`                                         |
| `routes/docs.tsx` + `docs.md`                         | `/docs`                                     |
| `routes/app-convention.tsx` + `app-convention.md`     | `/app-convention`                           |
| `routes/install.sh.ts` + `assets/install.sh`          | `/install.sh` (`application/x-sh`)          |
| `routes/install.ps1.ts` + `assets/install.ps1`        | `/install.ps1` (`application/x-powershell`) |
| `routes/_app.tsx`                                     | page shell and metadata                     |
| `islands/`, `components/`, `client.ts`                | interactive and shared UI                   |
| `static/`                                             | static files, `robots.txt`, `sitemap.xml`   |
| `main.ts`, `vite.config.ts`, `deno.json`, `deno.lock` | app entry, build, tasks, imports            |

`assets/install.sh` and `assets/install.ps1` are the only copies of the
installers. The `inline-raw-files` plugin in `vite.config.ts` inlines them at
build time, and the routes return them unchanged, logging
`{"event":"install.sh"}` or `{"event":"install.ps1"}` to stdout per request. See
[docs/release-components.md](../docs/release-components.md) for how they select
release assets.

## Build and run locally

```sh
deno task check   # fmt, lint, type check
deno task build   # vite build into _fresh/ (gitignored)
deno task start   # deno serve -A _fresh/server.js
deno task dev     # vite dev server with HMR
```

`scripts/verify.sh` runs `check` and `build` in CI for every pull request.
`start` serves a local build; it is not a recorded deployment command.

## Hosting

Recorded in this repository:

- The public origin is `https://pyrun.dev` (root `README.md`,
  `static/sitemap.xml`, `static/robots.txt`, metadata in `routes/_app.tsx`).
- After each release, the `verify-installers` job in
  `.github/workflows/release.yml` runs the live `https://pyrun.dev/install.sh`
  and `https://pyrun.dev/install.ps1`. It reads from the site; it does not
  deploy it.

Not recorded in this repository, and needed before a site change:

- The hosting provider and the project or app that serves `pyrun.dev`.
- What deploys the site, and from which branch or event. No workflow in
  `.github/workflows/` builds or deploys it.
- Who operates the hosting account and the `pyrun.dev` DNS.
- Which entry point production runs (for example `_fresh/server.js`).

Until those are supplied, a merged change under `site/` is merged source only;
merging does not show that `pyrun.dev` serves it. That includes
`assets/install.sh` and `assets/install.ps1`, which reach users only when the
live site serves them.
