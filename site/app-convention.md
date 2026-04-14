# app convention

pyr projects follow a convention. It's opinionated on purpose.

```
myapp/
  pyproject.toml
  requirements.txt
  .gitignore
  app/
    __init__.py
    config.py
    main.py
  .venv/
```

This isn't a suggestion. When you run `pyr init`, this is what you get. When you run `pyr run`, it executes `app/main.py` with `PYTHONPATH=.` set. That one environment variable is the whole trick.

## Why this matters

The most common question from someone starting a Python project is some variation of: "I have two files and I can't import one from the other."

The answers they find are:

- "Add `sys.path.append('..')` to your script" (fragile, breaks when you move files)
- "Use relative imports with dots" (confusing, fails when you run the file directly)
- "Install your project in editable mode with `pip install -e .`" (requires a full packaging setup for a script)
- "Just put everything in one file" (works until it doesn't)

None of these are wrong. All of them are ceremony. The actual answer is: put your code in a package directory with an `__init__.py`, and make sure the project root is on `PYTHONPATH`. Then `from app.config import ENV` works everywhere, every time, whether you're in `main.py`, a test file, or a one-off script.

`pyr run` does this for you. No configuration. No editable installs. No path hacking.

## The files

### app/main.py

```python
def main():
    print("hello world")


if __name__ == "__main__":
    main()
```

This is the entrypoint. `pyr run` executes this file. The `main()` function wrapper with the `__name__` guard means the file works both as a module (`from app.main import main`) and as a standalone script.

### app/config.py

```python
import os

ENV = os.getenv("ENV", "development")
```

Configuration lives here. Environment variables, feature flags, constants. Import it anywhere in your project with `from app.config import ENV`. One file, one source of truth.

This is deliberately minimal. It's not a settings framework. It's `os.getenv` with a default. You add what you need as you need it.

### app/__init__.py

Empty. That's fine. Its job is to make `app/` a Python package so imports resolve. You can add package-level exports later if you want, but you don't need to.

## Growing the project

The convention scales. Add modules as your project grows:

```
app/
  __init__.py
  config.py
  main.py
  db.py
  models.py
  routes.py
  utils.py
```

Every file can import from every other file:

```python
# in app/routes.py
from app.config import ENV
from app.db import get_connection
from app.models import User
```

No relative imports. No path manipulation. Just `from app.whatever import thing`.

### Subdirectories

When a module gets big enough to split, make it a package:

```
app/
  __init__.py
  config.py
  main.py
  services/
    __init__.py
    auth.py
    email.py
```

```python
# in app/main.py
from app.services.auth import authenticate
from app.services.email import send_welcome
```

Same pattern. The `__init__.py` in the subdirectory makes it a package. Imports stay clean and absolute.

## Tests

Put tests next to the code or in a top-level `tests/` directory. Both work because `PYTHONPATH=.` is set at the project root.

```
myapp/
  app/
    __init__.py
    config.py
    main.py
  tests/
    __init__.py
    test_main.py
```

```python
# in tests/test_main.py
from app.main import main
from app.config import ENV
```

Run them however you like — `pyr run -- -m pytest`, or directly with the venv's Python. The imports work because the project root is on the path.

## Passing arguments

`pyr run` forwards arguments after `--` to Python:

```
pyr run -- --verbose
pyr run -- -m pytest
pyr run -- -m pytest tests/ -v
```

The `--` separates pyr's flags from Python's. Everything after it goes straight through.

## Why not src layout?

The Python packaging world has a long debate about `src/` layout vs flat layout. The `src/` layout puts your package inside a `src/` directory to prevent accidental imports from the project root during development. It solves a real problem — but it solves it for library authors distributing packages via PyPI.

pyr is for applications. You're building something that runs, not something that gets installed into other people's environments. The flat `app/` layout is simpler, the imports are cleaner, and the failure mode it prevents (accidentally importing uninstalled code) doesn't apply when `pyr run` controls the environment.

If you're building a library for distribution, pyr is probably not the right tool. Use uv or poetry or flit. If you're building something that runs — a web app, a CLI, a data pipeline, a script that grew up — the `app/` convention is for you.

## The point

The convention is the product. Any tool can create a venv and install packages. pyr gives you a project structure that works from the first file to the hundredth, with imports that never break, and a runner that makes it invisible.

You don't configure it. You don't think about it. You write `from app.whatever import thing` and it works.
