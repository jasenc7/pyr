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

### **Cross-Compile Locally**

```sh
# Apple Silicon
deno compile -A --target aarch64-apple-darwin main.ts
# Windows x86
deno compile -A --target x86_64-pc-windows-msvc main.ts
# Windows ARM64
deno compile -A --target aarch64-pc-windows-msvc main.ts
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
