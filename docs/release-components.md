# Release components

What Pyr ships, where each piece comes from, and where each piece of state lives on a user's
machine. Installation, upgrades, rollback and restoration are in [operations.md](operations.md).

## Repository boundary

`jasenc7/pyr` is the active product repository and the only release source. The owner and name are
written into three files, which must agree:

- `PYR_REPO` in `lib.ts` (used by `pyr upgrade`)
- `REPO` in `site/assets/install.sh`
- `$Repo` in `site/assets/install.ps1`

The retained organization copy (`axiomlayer/pyr`) holds history only. No installer, upgrade path or
release workflow reads from it, and nothing in this document is published there.

## Components

| Component         | Source                                                                                 | Delivered by                                                       | Ships in a release |
| ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------ |
| CLI               | `main.ts` (argument parsing, the six commands), `lib.ts` (implementation), `deno.json` | `deno compile` in `.github/workflows/release.yml`                  | yes, five ZIPs     |
| POSIX installer   | `site/assets/install.sh`                                                               | `site/routes/install.sh.ts` at `https://pyrun.dev/install.sh`      | no                 |
| Windows installer | `site/assets/install.ps1`                                                              | `site/routes/install.ps1.ts` at `https://pyrun.dev/install.ps1`    | no                 |
| Website           | `site/` (see [site/README.md](../site/README.md))                                      | not recorded in this repository                                    | no                 |
| Managed CPython   | upstream `astral-sh/python-build-standalone` releases, `install_only` assets           | downloaded by the CLI on first use and by `pyr upgrade --python`   | no                 |
| Project packages  | the package index pip is configured for (PyPI by default)                              | pip inside each project's `.venv`, driven by `pyr add/remove/sync` | no                 |

The six commands are `init`, `run`, `add`, `remove`, `sync` and `upgrade` (`COMMANDS` in `main.ts`).
The compiled executable is standalone: its graph is local source plus Deno and Node built-ins, and
it does not use an installed Deno, Node, npm or system Python.

Each installer exists once. The site build inlines `site/assets/install.sh` and
`site/assets/install.ps1` through the `inline-raw-files` plugin in `site/vite.config.ts`, and the
two routes return them unchanged.

## Release assets

Pushing a `v*` tag runs `.github/workflows/release.yml`. Each asset is built and smoke-tested on a
runner of its own architecture, never cross-compiled.

| Asset                    | Runner             | `deno compile` target       | Executable in ZIP | Selected by                                    |
| ------------------------ | ------------------ | --------------------------- | ----------------- | ---------------------------------------------- |
| `pyr-darwin-aarch64.zip` | `macos-15`         | `aarch64-apple-darwin`      | `pyr`             | `install.sh`, `pyr upgrade`                    |
| `pyr-darwin-x86_64.zip`  | `macos-15-intel`   | `x86_64-apple-darwin`       | `pyr`             | `install.sh`, `pyr upgrade`                    |
| `pyr-linux-aarch64.zip`  | `ubuntu-24.04-arm` | `aarch64-unknown-linux-gnu` | `pyr`             | `install.sh` (Linux and WSL), `pyr upgrade`    |
| `pyr-linux-x86_64.zip`   | `ubuntu-24.04`     | `x86_64-unknown-linux-gnu`  | `pyr`             | `install.sh` (Linux and WSL), `pyr upgrade`    |
| `pyr-windows-x86_64.zip` | `windows-latest`   | `x86_64-pc-windows-msvc`    | `pyr.exe`         | `install.ps1` on AMD64, `pyr upgrade`          |
| `SHA256SUMS`             | `ubuntu-latest`    | n/a                         | n/a               | every installer and upgrade, before extracting |

Name contract: `pyr-<os>-<arch>.zip` with one executable at the archive root. Four places depend on
it and change together: the `asset` column of the build matrix, `install.sh` (from `uname`),
`install.ps1` (from `PROCESSOR_ARCHITECTURE`) and `platformAssetName()` in `lib.ts` (from
`Deno.build`). Windows releases target x64 PCs.

### Release workflow stages

1. `verify` runs `scripts/verify.sh`: format, lint, type check and tests for the CLI, then the
   site's check and build.
2. `build` runs once per asset: confirms the runner architecture, compiles, smoke-tests (`--version`
   must equal the tag without its leading `v`, then `--help`, `init`, `run`), zips, and re-checks
   the archived executable.
3. `publish` writes `SHA256SUMS` over the five ZIPs and creates the GitHub release for the existing
   tag (`gh release create --verify-tag`).
4. `verify-installers` checks out the release tag and runs its canonical installers against the
   published binaries on all five hosted runners. Site deployment is independent.

The version is the `version` field of `deno.json`, compiled in as `PYR_VERSION`. A tag that differs
from it fails the smoke test, so nothing is published.

## Integrity checks

- Installers resolve one release tag from `releases/latest`, fetch that tag's `SHA256SUMS`, and
  verify the ZIP before extracting it.
- `pyr upgrade` applies the same `SHA256SUMS` check, then requires the new executable to run and
  report the release version before it replaces the running one.
- Managed CPython is checked against the upstream release's checksums before extraction, and the
  staged interpreter must report the expected version and import `venv` and `ensurepip` before it
  replaces the live runtime.

## State locations

`PYR_HOME` is the `PYR_HOME` environment variable when set. Otherwise it is `<home>/.pyr`, where
`<home>` is `$HOME` on macOS, Linux and WSL, and `%USERPROFILE%` on native Windows (`pyrHome()` and
`userHome()` in `lib.ts`).

| State                  | macOS, Linux, WSL                         | Native Windows                     | Created by                     | Changed by                                                                  |
| ---------------------- | ----------------------------------------- | ---------------------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| CLI executable         | `$PYR_HOME/bin/pyr`                       | `$PYR_HOME\bin\pyr.exe`            | installer                      | `pyr upgrade`, which replaces the running executable wherever it is         |
| Replaced executable    | none                                      | `pyr.exe.old` next to `pyr.exe`    | `pyr upgrade` on Windows       | deleted the next time `pyr` starts                                          |
| Managed CPython        | `$PYR_HOME/python/` (`bin/python3`)       | `$PYR_HOME\python\` (`python.exe`) | first venv creation or restore | `pyr upgrade --python`                                                      |
| Runtime version, build | `$PYR_HOME/python/.version`, `.build`     | same, under `$PYR_HOME\python\`    | CPython install                | CPython install                                                             |
| CPython install lock   | `$PYR_HOME/.python-install-lock/`         | same, under `$PYR_HOME\`           | each CPython install           | removed when the install ends                                               |
| CPython staging        | `$PYR_HOME/.python-install-*/`            | same, under `$PYR_HOME\`           | each CPython install           | removed when the install ends, unless a failed swap could not be undone     |
| Project venv           | `<project>/.venv/` (`bin/`)               | `<project>\.venv\` (`Scripts\`)    | `pyr init` or restore          | rebuilt by `pyr run/add/remove/sync` when the managed CPython version moves |
| Venv runtime stamp     | `<project>/.venv/.pyr-python`             | `<project>\.venv\.pyr-python`      | `pyr init`, venv rebuild       | venv rebuild                                                                |
| Declared dependencies  | `pyproject.toml` `[project].dependencies` | same                               | `pyr init`                     | `pyr add`, `pyr remove`, hand edits                                         |
| Lock                   | `requirements.txt`                        | same                               | `pyr init` (empty)             | `pyr sync`, also run by `add`, `remove`, and `run` after declaration edits  |

The CLI executable holds no project state. One managed CPython serves every project under the same
`PYR_HOME`. Each project's `.venv` and its packages belong to that project alone.

## Network dependencies at runtime

- `api.github.com/repos/jasenc7/pyr/releases/latest` and GitHub release downloads: installers and
  `pyr upgrade`.
- `api.github.com/repos/astral-sh/python-build-standalone/releases/latest`, or
  `releases/tags/<build>` for an exact pin: managed CPython installs.
- The package index pip is configured for: `pyr add`, `pyr remove`, `pyr sync`, venv restores and
  rebuilds.
- `pyrun.dev` serves the installer scripts only. The CLI never contacts it.
