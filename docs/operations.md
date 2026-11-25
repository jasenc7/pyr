# Operations

Installing, upgrading, rolling back and restoring Pyr. File locations and release assets are listed
in [release-components.md](release-components.md). Paths below use `$PYR_HOME`, which defaults to
`~/.pyr` on macOS, Linux and WSL and to `%USERPROFILE%\.pyr` on native Windows.

## Three separate things change

A machine running Pyr has three independently versioned layers. Each has its own command, its own
state and its own rollback.

| Layer               | Changed by                             | Touches                                                      | Leaves alone                                       |
| ------------------- | -------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| CLI executable      | installer, `pyr upgrade`               | the `pyr` or `pyr.exe` executable                            | `$PYR_HOME/python`, every project                  |
| Managed CPython     | `pyr upgrade --python [X.Y.Z[+BUILD]]` | `$PYR_HOME/python`                                           | the CLI; projects until their next use (see below) |
| Project environment | `pyr add`, `pyr remove`, `pyr sync`    | that project's `pyproject.toml`, `requirements.txt`, `.venv` | the CLI, the managed CPython, other projects       |

The only coupling: when the managed CPython's `X.Y.Z` version changes, each project's `.venv` is
rebuilt the next time `pyr run`, `add`, `remove` or `sync` runs in it.

## Install

### macOS and Linux

```sh
curl -fsSL https://raw.githubusercontent.com/jasenc7/pyr/main/site/assets/install.sh | sh
```

Installs the latest release's `pyr` into `$PYR_HOME/bin`. Needs `curl`, `unzip`, and `sha256sum` or
`shasum`. It prints the `PATH` line for `$PYR_HOME/bin` and `$PYR_HOME/python/bin` if they are
missing. The managed CPython is not installed here; creating or restoring the first venv downloads
it.

### WSL

WSL is Linux. Run `install.sh` inside WSL. It installs a Linux executable under the WSL home
(`~/.pyr`), and the managed CPython and project venvs it creates are Linux ones.

### Native Windows

```powershell
irm https://raw.githubusercontent.com/jasenc7/pyr/main/site/assets/install.ps1 | iex
```

Installs `pyr.exe` into `$PYR_HOME\bin` (default `%USERPROFILE%\.pyr\bin`) and prints the command
that adds `$PYR_HOME\bin` and `$PYR_HOME\python` to the user `PATH`. Git Bash is native Windows: use
`install.ps1` from PowerShell. `install.sh` refuses to run under MSYS or Cygwin.

### Keep WSL and native Windows apart

WSL and native Windows each need their own install, runtime and project venvs.

- Give each its own `PYR_HOME`. Do not point WSL's `PYR_HOME` at the Windows one (for example
  `/mnt/c/Users/<you>/.pyr`) or the reverse: both write `python/` with a platform-specific CPython
  build and would replace each other's runtime.
- Do not share a project `.venv` across the boundary. Windows venvs keep their interpreter in
  `.venv\Scripts\python.exe`, Linux venvs in `.venv/bin/python`, and both record their runtime
  version in the same `.venv/.pyr-python` stamp. The other side either reports a missing platform
  interpreter or, when the stamped version differs from its own runtime, deletes and rebuilds the
  whole `.venv`. Use a separate checkout for each side.

## Upgrade

### CLI: `pyr upgrade`

Asks `jasenc7/pyr` for the release GitHub marks as latest. If its tag matches the running version,
it prints `already up to date`. Otherwise it downloads this platform's ZIP from that release, checks
it against the release's `SHA256SUMS`, runs the new executable to confirm it reports that version,
and then replaces the running executable. On Windows the running `pyr.exe` is renamed to
`pyr.exe.old` first and deleted the next time Pyr starts.

`pyr upgrade` takes no version: it only ever moves to the release marked latest. Re-running the
installer has the same effect, except that the installer always writes `$PYR_HOME/bin`, while
`pyr upgrade` replaces whichever executable is running. Neither touches the managed CPython or any
project.

### Managed CPython: `pyr upgrade --python`

| Form                               | Installs                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `pyr upgrade --python`             | the newest CPython in the latest upstream python-build-standalone release    |
| `pyr upgrade --python X.Y.Z`       | that version from the latest upstream release; fails if it is not there      |
| `pyr upgrade --python X.Y.Z+BUILD` | that exact upstream release and asset, recorded in `$PYR_HOME/python/.build` |

Every form takes `$PYR_HOME/.python-install-lock`, stages under `$PYR_HOME/.python-install-*`,
verifies the upstream checksum and the staged interpreter, and only then swaps it in. If the swap
fails, the previous runtime is moved back. If the installed version and exact build already match
and the interpreter passes its probe, nothing is downloaded.

When `X.Y.Z` changes, Pyr prints `project venvs will rebuild on next pyr run`. On its next
`pyr run`, `add`, `remove` or `sync`, each project deletes its `.venv`, recreates it from the new
runtime and reinstalls `requirements.txt` exactly as pinned. A build change within the same `X.Y.Z`
does not rebuild venvs.

Before upgrading, record the current build. It is the rollback target:

```sh
cat "${PYR_HOME:-$HOME/.pyr}/python/.build"
```

```powershell
$pyrHome = if ($env:PYR_HOME) { $env:PYR_HOME } else { Join-Path $env:USERPROFILE '.pyr' }
Get-Content "$pyrHome\python\.build"
```

Runtimes installed before `.build` existed have only `.version`. They refresh once on their next
explicit `pyr upgrade --python`.

### Project dependencies: `pyr add`, `pyr remove`, `pyr sync`

`pyproject.toml` `[project].dependencies` is the declaration and `requirements.txt` is the
generated, fully pinned lock. `pyr add` and `pyr remove` edit the declaration and then sync. In an
existing venv, `pyr sync` re-resolves the declaration with pip (`pip install --upgrade`), installs
what it resolved, uninstalls packages nothing requires any more, and rewrites `requirements.txt`. If
resolution fails, the existing lock is left untouched. `pyr run` syncs first when `pyproject.toml`
changes after a fresh restore. After a regular sync, Pyr uses the modification times of the two
files.

Because `pyr sync` re-resolves, it can move pins forward. Installing `requirements.txt` as written
is what reproduces a committed lock (see [Restore a project `.venv`](#restore-a-project-venv)).

## Rollback

### CLI

A CLI rollback puts the preceding release's executable for the same platform back in place. Project
files, project venvs and `$PYR_HOME/python` are not touched.

Releases published from `jasenc7/pyr` start at `v0.1.2`. Artifacts of earlier releases were not
republished (see `CHANGELOG.md`), so a CLI rollback needs a release after `v0.1.2` to roll back
from.

Neither installer nor `pyr upgrade` accepts a version, so restore the executable by hand from the
preceding release, verified against that release's own `SHA256SUMS`. Pick this machine's asset from
the table in [release-components.md](release-components.md#release-assets).

macOS, Linux and WSL:

```sh
tag=vX.Y.Z                    # the preceding release
asset=pyr-linux-x86_64.zip    # this machine's asset
base="https://github.com/jasenc7/pyr/releases/download/$tag"
cd "$(mktemp -d)"
curl --proto '=https' --tlsv1.2 -fsSLO "$base/SHA256SUMS"
curl --proto '=https' --tlsv1.2 -fsSLO "$base/$asset"
expected=$(awk -v n="$asset" '$2 == n || $2 == "*" n { print $1 }' SHA256SUMS)
actual=$( (sha256sum "$asset" 2>/dev/null || shasum -a 256 "$asset") | awk '{ print $1 }')
if [ -n "$expected" ] && [ "$expected" = "$actual" ] && unzip -q "$asset" &&
  version=$(./pyr --version) && [ "$version" = "${tag#v}" ]; then
  mv ./pyr "$(command -v pyr)"
else
  echo "verification failed: CLI not replaced"
fi
```

The replacement runs only when the checksum matches, the candidate runs successfully, and it reports
exactly the selected version, mirroring the checksum and version checks `pyr upgrade` applies before
it replaces itself.

Native Windows (PowerShell):

```powershell
$tag = 'vX.Y.Z'                       # the preceding release
$asset = 'pyr-windows-x86_64.zip'
$base = "https://github.com/jasenc7/pyr/releases/download/$tag"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12  # Windows PowerShell 5.1
$tmp = Join-Path ([IO.Path]::GetTempPath()) ([Guid]::NewGuid())
New-Item -ItemType Directory -Path $tmp | Out-Null
Invoke-WebRequest "$base/SHA256SUMS" -OutFile "$tmp\SHA256SUMS" -UseBasicParsing
Invoke-WebRequest "$base/$asset" -OutFile "$tmp\$asset" -UseBasicParsing
$line = Get-Content "$tmp\SHA256SUMS" | Where-Object { $_ -match "^[0-9A-Fa-f]{64}\s+\*?$([regex]::Escape($asset))$" }
$expected = if ($line) { ($line -split '\s+')[0] } else { $null }
$ok = $false
if ($expected -and (Get-FileHash -Algorithm SHA256 "$tmp\$asset").Hash -ieq $expected) {
  Expand-Archive "$tmp\$asset" -DestinationPath $tmp
  $version = & "$tmp\pyr.exe" --version
  $ok = ($LASTEXITCODE -eq 0) -and ($version -is [string]) -and ($version -ceq $tag.Substring(1))
}
if ($ok) { Move-Item "$tmp\pyr.exe" (Get-Command pyr).Source -Force } else { Write-Error 'verification failed: CLI not replaced' }
```

As above, `pyr.exe` is replaced only after the checksum, a successful run and an exact version
match: the output must be one line (`-is [string]`; several lines arrive as an array) equal to the
selected version, compared case-sensitively (`-ceq`). Each check is a condition of the block that
moves the file, so pasting the lines one at a time cannot skip one.

After rolling back, do not run `pyr upgrade` or the installer on that machine until the newer
release is fixed: both move straight back to the release marked latest.

For every machine at once, the release mechanism is the release GitHub marks as latest on
`jasenc7/pyr`. The installers, `pyr upgrade` and the release workflow's `verify-installers` job all
follow it. `pyr upgrade` replaces the executable whenever the latest tag differs from the running
version, so marking the preceding release as latest moves upgraded machines back to it on their next
`pyr upgrade`. That is a release-publication decision for the repository owner. No automation in
this repository performs it.

### Managed CPython

Rolling back the runtime is a separate, deliberate operation, and it is not part of a CLI rollback.
Reinstall the build you recorded before upgrading:

```sh
pyr upgrade --python X.Y.Z+BUILD
```

This uses the same lock, checksum, staging and swap path as an upgrade. If `X.Y.Z` differs from the
current runtime, each project's `.venv` rebuilds on its next use from its `requirements.txt`. Pyr
keeps no copy of the replaced runtime after a successful upgrade, so the upstream release must still
carry that build's asset.

## Restoration

### Interrupted CPython install

If a CPython install was interrupted, the next one stops with `python installation is locked`.
Confirm no Pyr process is running, then look for `$PYR_HOME/.python-install-*`. If a failed upgrade
could not move the previous runtime back, it is kept at `$PYR_HOME/.python-install-*/previous`: move
that directory to `$PYR_HOME/python` before deleting anything. Then remove
`$PYR_HOME/.python-install-lock`.

A runtime directory without `python/.version` counts as a partial install, and `pyr init` reinstalls
it.

### Missing managed CPython

If `$PYR_HOME/python` is gone but projects remain, reinstall the recorded build with
`pyr upgrade --python X.Y.Z+BUILD`. Projects whose `.venv/.pyr-python` stamp matches that version
resume as they were. Projects stamped with another version rebuild on their next use.

### Restore a project `.venv`

From the cloned app directory, run `pyr sync` to recreate a missing `.venv` or `pyr run` to restore
and launch in one step. Both require `app/main.py`, `pyproject.toml` and `requirements.txt`. Pyr
bootstraps its managed interpreter if needed, installs the locked entries and checks their
dependencies before marking the venv ready. Checkout timestamps do not trigger a second resolution.
A failed install removes the newly created venv so you can fix the cause and retry.

If restoration was interrupted and no Pyr process is still running, move the incomplete `.venv`
aside and retry. An existing venv from another platform also needs a separate checkout or to be
moved aside. In an existing environment, explicit `pyr sync` resumes its usual update behavior.
