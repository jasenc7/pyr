# Contributing to pyr

Thanks for your interest! pyr is a minimal tool, and contributions should focus on reducing ceremony
for Python projects.

---

## **Reporting Bugs**

Open an [issue](https://github.com/jasenc7/pyr/issues) with:

- Steps to reproduce.
- Expected/actual behavior.
- OS, Python version, and `pyr --version`.

---

## **Suggesting Features**

Open a [Discussion](https://github.com/jasenc7/pyr/discussions) first. pyr’s scope is intentionally
narrow:

- Does it reduce ceremony for Python projects?
- Would it make sense for `pip` or `venv` to do this?\
  If not, it’s likely out of scope.

---

## **Pull Requests**

1. Fork the repo and create a branch.
2. Run checks:

```sh
bash scripts/verify.sh
```

3. Open a PR with:

- A clear description.
- Reference to any related issues.

---

## **Code Style**

- **TypeScript:** Use `deno fmt`.
- **Shell scripts:** Use `shellcheck`.

---

## **Development Setup**

```sh
git clone https://github.com/jasenc7/pyr.git
cd pyr
bash scripts/verify.sh
```

Verification uses Deno, Git and Python 3 with `venv` and `ensurepip`. The clone smoke test creates a
disposable local repository, Python runtime and wheel directory and disables package index access.
Run it against a candidate binary with `python scripts/clone_smoke.py <path-to-pyr>`.

On a native Intel/AMD Windows PC, download the `pyr-windows-x86_64-preview` artifact from the
candidate's CI run. Extract the artifact and its inner ZIP. From the folder containing `pyr.exe`,
open PowerShell and try a new, unsynced temporary directory:

```powershell
$pyr = (Resolve-Path .\pyr.exe).Path
$work = New-Item -ItemType Directory (Join-Path $env:TEMP ([guid]::NewGuid()))
$env:PYR_HOME = Join-Path $work 'pyr-home'
Set-Location $work
& $pyr init hello
Set-Location hello
& $pyr run
```

Expect `hello world`. To exercise a real Git clone, run the offline smoke test above with the
extracted executable. Windows and Ubuntu 24.04 in WSL should use separate checkouts and runtimes.

### **Cross-Compile Locally**

```sh
# Apple Silicon
deno compile -A --target aarch64-apple-darwin main.ts
# Windows x64 (Intel/AMD)
deno compile -A --target x86_64-pc-windows-msvc main.ts
# Linux x86
deno compile -A --target x86_64-unknown-linux-gnu main.ts
# Linux ARM
deno compile -A --target aarch64-unknown-linux-gnu main.ts
# Apple Intel x86
deno compile -A --target x86_64-apple-darwin main.ts
```

### **Site Development**

```sh
cd site
deno task dev
```

The site runs in Vite with HMR.

---

**Note:** pyr is not an app - it’s a tool. Keep changes minimal and focused.
