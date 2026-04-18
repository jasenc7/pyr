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

### macOS / Linux

```sh
curl -fsSL https://pyrun.dev/install.sh | sh
```

The script installs `pyr` to `~/.pyr/bin/`. Add this to your `PATH`.

### Windows

```powershell
irm https://pyrun.dev/install.ps1 | iex
```

Installs `pyr.exe` to `%USERPROFILE%\.pyr\bin\`. Add this to your `PATH`.

---

## **Quickstart**

```sh
pyr init myapp        # Scaffold a project
cd myapp
pyr run               # Run app/main.py
pyr add httpx         # Add a dependency
pyr remove httpx      # Remove a dependency
pyr sync              # Reconcile venv + lock with pyproject.toml
pyr upgrade           # Update pyr itself
pyr upgrade --python  # Update the managed CPython
```

---

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
