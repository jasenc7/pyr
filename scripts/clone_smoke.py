"""Exercise a disposable Git handoff with a local Python and offline wheel index."""

import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import zipfile


def wheel(directory, version):
    package = "pyr_fixture"
    name = f"{package}-{version}"
    info = f"{name}.dist-info"
    files = {
        f"{package}.py": f"version = '{version}'\n",
        f"{info}/METADATA": f"Metadata-Version: 2.1\nName: pyr-fixture\nVersion: {version}\n",
        f"{info}/WHEEL": "Wheel-Version: 1.0\nRoot-Is-Purelib: true\nTag: py3-none-any\n",
    }
    record = f"{info}/RECORD"
    files[record] = "".join(f"{path},,\n" for path in [*files, record])
    with zipfile.ZipFile(directory / f"{name}-py3-none-any.whl", "w") as archive:
        for path, data in files.items():
            archive.writestr(path, data)


def smoke(root, cli):
    wheels = root / "wheels"
    wheels.mkdir()
    pyr_home = root / "pyr-home"
    runtime = pyr_home / "python"
    env = {key: os.environ[key] for key in (
        "PATH", "SystemRoot", "WINDIR", "COMSPEC", "PATHEXT", "DENO_DIR",
        "LD_LIBRARY_PATH", "SYSTEMDRIVE",
    ) if key in os.environ}
    env.update(
        HOME=str(root), USERPROFILE=str(root), PYR_HOME=str(pyr_home),
        TEMP=str(root), TMP=str(root), TMPDIR=str(root),
        GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull, GIT_TERMINAL_PROMPT="0",
        PIP_NO_INDEX="1", PIP_FIND_LINKS=wheels.as_uri(), PIP_CONFIG_FILE=os.devnull,
        PIP_DISABLE_PIP_VERSION_CHECK="1", PIP_NO_CACHE_DIR="1",
    )

    def run(args, cwd=root, success=True):
        result = subprocess.run(args, cwd=cwd, env=env, text=True,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        if (result.returncode == 0) != success:
            raise RuntimeError(f"{args} exited {result.returncode}\n{result.stdout}")
        return result.stdout

    run([sys.executable, "-m", "venv", "--without-pip", str(runtime)])
    if os.name == "nt":
        shutil.copy2(runtime / "Scripts/python.exe", runtime / "python.exe")
    (runtime / ".version").write_text(sys.version.split()[0])
    wheel(wheels, "1.0")
    run([*cli, "init", "original"])
    project = root / "original"
    assert run([*cli, "run"], project).splitlines()[-1] == "hello world"
    run([*cli, "add", "pyr-fixture>=1"], project)
    (project / "app/main.py").write_text("import pyr_fixture\nprint(pyr_fixture.version)\n")
    run(["git", "init", "-q"], project)
    run(["git", "add", "."], project)
    run(["git", "-c", "user.name=Pyr", "-c", "user.email=pyr@example.invalid",
         "commit", "-qm", "fixture"], project)
    wheel(wheels, "2.0")
    for command in ("sync", "run"):
        clone = root / f"clone-{command}"
        run(["git", "clone", "--quiet", str(project), str(clone)])
        assert not (clone / ".venv").exists()
        lock = clone / "requirements.txt"
        pinned = lock.read_bytes()
        manifest = clone / "pyproject.toml"
        # Checkout timestamps carry no dependency intent.
        os.utime(lock, (1_000_000, 1_000_000))
        if command == "sync":
            archive = wheels / "pyr_fixture-1.0-py3-none-any.whl"
            unavailable = root / archive.name
            archive.rename(unavailable)
            output = run([*cli, command], clone, success=False)
            assert "failed to restore packages" in output, output
            assert not (clone / ".venv").exists()
            assert lock.read_bytes() == pinned
            assert run(["git", "status", "--porcelain"], clone) == ""
            unavailable.rename(archive)
        output = run([*cli, command], clone)
        if command == "run":
            assert output.splitlines()[-1] == "1.0", output
        assert run([*cli, "run"], clone).splitlines()[-1] == "1.0"
        assert lock.read_bytes() == pinned
        assert run(["git", "status", "--porcelain"], clone) == ""
        manifest.write_text(manifest.read_text().replace("pyr-fixture>=1", "pyr-fixture>=2"))
        assert run([*cli, "run"], clone).splitlines()[-1] == "2.0"
        assert "pyr-fixture==2.0" in lock.read_text()
    print("Passed offline create, clone, locked sync/run, failed restore, retry and edit.")


if __name__ == "__main__":
    repo = Path(__file__).resolve().parents[1]
    cli = ([str(Path(sys.argv[1]).resolve())] if len(sys.argv) > 1
           else ["deno", "run", "-A", str(repo / "main.ts")])
    with tempfile.TemporaryDirectory(prefix="pyr-clone-") as directory:
        smoke(Path(directory).resolve(), cli)
