# [pyr](http://pyrun.dev)

**Python without the ceremony.**\
A project manager that bootstraps its own runtime, manages your venv, and gets out of the way.\
Six commands. One honest lockfile.

[Website](https://pyrun.dev)\
[Docs](https://pyrun.dev/docs)\
[App Convention](https://pyrun.dev/app-convention)\
[Blog: Why pyr?](https://jasencarroll.com/python-project-manager.html)\
[Blog: How pyr Works](https://jasencarroll.com/how-pyr-works.html)

---

## **Installation**

The canonical installer scripts live in `site/assets/` in `jasenc7/pyr`. The website serves copies
at `pyrun.dev/install.sh` and `pyrun.dev/install.ps1`. Both installers fetch binaries from this
repository’s GitHub Releases.

### macOS / Linux

```sh
curl -fsSL https://raw.githubusercontent.com/jasenc7/pyr/main/site/assets/install.sh | sh
```

The script installs `pyr` to `~/.pyr/bin/`. Add this to your `PATH`.

WSL is a Linux environment: run this installer inside WSL and keep its Linux `~/.pyr` separate from
native Windows Pyr. A WSL install uses Linux binaries and `bin/` venv layouts; it cannot safely
share `%USERPROFILE%\.pyr` or project venvs with the Windows executable.

### Windows

On a 64-bit Intel or AMD PC, open PowerShell and run the following command.

```powershell
irm https://raw.githubusercontent.com/jasenc7/pyr/main/site/assets/install.ps1 | iex
```

Installs `pyr.exe` to `%USERPROFILE%\.pyr\bin\`. Add this to your `PATH`.

Run the PATH command printed by the installer, reopen PowerShell, then try `pyr init hello`,
`cd hello` and `pyr run`. The app prints `hello world`. Native 32-bit Windows is unsupported.

Git Bash is still native Windows. Run the PowerShell installer (not `install.sh`), then restart Git
Bash so it inherits the updated user `PATH`. Native Pyr prefers `%USERPROFILE%` over Git Bash's
POSIX-looking `$HOME`; set `PYR_HOME` explicitly when a different Windows-native location is wanted.

Every release publishes a `SHA256SUMS` file next to the zips. The installers resolve one release
tag, verify the selected ZIP against that manifest, and only then install it; `pyr upgrade` and the
managed CPython bootstrap apply the same fail-closed check. Release builds run on native GitHub
hosted runners for all five supported platform and architecture combinations before publication.

The shipped executable is standalone: it neither uses nor modifies an existing Deno, fnm, Node, or
npm installation. Its release compilation graph uses only local source and Deno/Node built-ins - no
JSR packages. The website has a separate build toolchain and is not embedded in release artifacts.

---

## Windows x64 walkthrough

Use a fresh PowerShell session on an Intel/AMD x64 Windows PC with Git for Windows, an internet
connection, and an unsynced temporary folder. The standalone CLI supplies Python. Git is used for
the handoff in step 2. The clone feature requires a release containing this change; published v0.1.2
predates it. CI exercises the candidate package in the same ZIP layout before release.
[Product specification and verification matrix](SPEC.md).

### 1. Install, scaffold and run

Start anywhere in the fresh shell. Use a disposable Pyr home and a session-only PATH:

<!-- walkthrough:install -->

```powershell
Set-Location $env:TEMP
$work = New-Item -ItemType Directory ([guid]::NewGuid().ToString())
Set-Location $work
$env:PYR_HOME = Join-Path $work 'managed'
irm https://raw.githubusercontent.com/jasenc7/pyr/main/site/assets/install.ps1 | iex
$env:Path = "$env:PYR_HOME\bin;$env:Path"
pyr --version
pyr init hello
Set-Location hello
pyr run
Test-Path "$env:PYR_HOME\python\python.exe"
Test-Path ".venv\Scripts\python.exe"
```

The installer identifies `pyr-windows-x86_64.zip`. Expect the release version, `hello world` from
`app/main.py`, and `True` twice. The first app on a new machine downloads a managed CPython.

### 2. Clone the sample, restore its dependency and run it twice

Continue in the `hello` directory. Make the sample print the installed version of its dependency,
commit the app locally, and clone it. The scaffold ignores `.venv`.

<!-- walkthrough:clone -->

```powershell
pyr add "idna==3.10"
'from importlib.metadata import version; print(version("idna"))' | Set-Content -Encoding ascii app/main.py
git init -q
git add .
git -c user.name=Pyr -c user.email=pyr@example.invalid commit -qm sample
Set-Location $work
git clone --quiet hello copy
Set-Location copy
Test-Path .venv
pyr run
Get-Content requirements.txt
pyr run
git status --porcelain
```

Expect `False`, then a restore followed by `3.10`. The lock includes `idna==3.10`, the second run
prints `3.10`, and Git status is empty. An explicit `pyr sync` in an existing venv re-resolves the
declaration and can update pins. In a missing venv, sync consumes the committed pins. Editing
`pyproject.toml` can also trigger a sync on the next run. `pyr upgrade` replaces the CLI.
`pyr upgrade --python [X.Y.Z+BUILD]` changes the shared interpreter after checking the candidate.
The exact-build and rollback procedure is in [operations](docs/operations.md).

To observe a deliberate dependency update separately, edit the sample declaration and sync:

<!-- walkthrough:edit -->

```powershell
(Get-Content pyproject.toml -Raw).Replace('idna==3.10', 'idna==3.11') | Set-Content -Encoding ascii pyproject.toml
pyr sync
pyr run
Get-Content requirements.txt
Get-Content "$env:PYR_HOME\python\.version"
```

Expect `3.11` from the app, `idna==3.11` in the lock, and a separate CPython version stamp. A
dependency sync changes this app's packages. Shared interpreter updates use `pyr upgrade --python`.

Clean up in the same disposable session and close PowerShell:

<!-- walkthrough:cleanup -->

```powershell
Set-Location $env:TEMP
Remove-Item -LiteralPath $work.FullName -Recurse -Force
```

## **Why pyr?**

- **Zero system deps:** Bootstraps its own CPython. No brew, no apt, no pyenv.
- **Six commands:** `init`, `run`, `add`, `remove`, `sync`, `upgrade`. No `activate`, no
  `pip freeze`.
- **Honest lockfile:** `pyproject.toml` is the source of truth. `requirements.txt` is a generated,
  fully-pinned lock.
- **Self-updating:** `pyr upgrade` updates the tool. `pyr upgrade --python` updates the runtime.
- **Not written in Python:** The tool that manages Python shouldn’t need Python to install.

---

## **Project Layout**

After `pyr init myapp`:

```
myapp/
  pyproject.toml         # Edit dependencies here
  requirements.txt       # Generated lockfile
  .gitignore
  app/
    __init__.py
    config.py            # ENV from os.getenv
    main.py              # Entrypoint
  .venv/                 # Project-local venv
```

---

## **How It Works**

- **Bootstrapping:** Downloads a standalone CPython into `~/.pyr/python` on first use.
- **Venv Management:** Creates a project-local `.venv` from the managed Python. Rebuilds
  automatically if the Python version changes.
- **Dependency Resolution:** Delegates to `pip`. `requirements.txt` is a generated lockfile.
- **TOML Surgery:** Edits `pyproject.toml` without destroying comments or formatting.
- **Self-Upgrades:** Replaces the running binary with the latest release.

Python bootstrap and upgrade use the same installer. `pyr upgrade --python` checks release metadata
once and skips the download only when the installed CPython version and exact upstream build both
match and pass a runtime check. Otherwise it obtains the upstream checksum manifest, verifies the
archive before extracting, then checks the replacement before moving the existing runtime. Older
installs without an exact-build stamp refresh once on their next explicit Python upgrade. A failed
replacement move restores the previous installation.

`pyr upgrade --python X.Y.Z` selects only that CPython version from the current upstream release and
fails if it is absent - there is no fallback to the release's newest Python. For a durable runtime
manifest, use `X.Y.Z+BUILD` (for example `3.14.7+20260901`): pyr resolves that exact
python-build-standalone release and asset, verifies its release checksum, and records the full build
identifier. Both forms use the same lock, staging, interpreter probe, and rollback path.

For a deep dive, see:

- [How pyr Works](https://jasencarroll.com/how-pyr-works.html)
- [The App Convention](https://pyrun.dev/app-convention)

---

## **Philosophy**

> The thing that manages Python shouldn’t be Python.

`pyr` is a single compiled binary. It drives `pip` and the standalone CPython runtime; it doesn’t
depend on them to install itself.

---

## **Community & Support**

- **Discussions:** [GitHub Discussions](https://github.com/jasenc7/pyr/discussions)
- **Issues:** [GitHub Issues](https://github.com/jasenc7/pyr/issues)
- **Email:** [Publicly listed on GitHub profile](https://github.com/jasenc7)
