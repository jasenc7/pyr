# Pyr product specification

## Purpose and intended use

Pyr runs Python apps using a managed interpreter and a reproducible per-app environment. A developer
can start a new app or clone a teammate's app and launch `app/main.py` without manually creating a
venv. Windows users install a standalone x64 executable. Linux and macOS have standalone Intel and
ARM64 builds. Each platform owns its local interpreter and venv.

## User requirements and acceptance matrix

| ID     | Required behavior                                                                                                                                                                        | README | Acceptance case and platform                                                                                                                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PYR-01 | Install the canonical x64 package, scaffold and launch the documented app with no end-user Deno.                                                                                         | 1      | Windows x64 runs the literal PowerShell installer and scaffold block. Check package bytes, version, `hello world`, managed interpreter and project venv paths.                                                      |
| PYR-02 | Restore a missing venv from the committed lock. Preserve the lock on plain and repeated runs. Remove an incomplete restore so the user can retry.                                        | 2      | Windows, Linux and macOS offer wheels 1.0 and 2.0, clone without a venv, import 1.0 and compare lock bytes. Request an unavailable pin, verify cleanup and retry. Windows also runs the literal README clone block. |
| PYR-03 | Allow declaration edits or explicit sync in an existing venv to update pins. Keep CLI and managed runtime upgrades separate. Restore the previous usable runtime after failed promotion. | 2      | Windows, Linux and macOS check the edit upgrades a fixture to 2.0, an unchanged runtime build skips download, and forced promotion failure restores the prior build and runs an app with it.                        |

The [trace manifest](trace.json) maps each requirement to test paths, named cases and CI lanes.
[Operations](docs/operations.md) documents state changes and recovery. The
[walkthrough](README.md#windows-x64-walkthrough) names prerequisites, inputs, commands, expected
results and cleanup.

## Verification records

Every successful acceptance job writes its tested Git commit, OS/architecture, requirement results,
walkthrough steps and package SHA-256 into its Actions job summary. These records are generated
after the tests pass, so they identify the tested bytes even if the branch moves.
[CI runs](https://github.com/jasenc7/pyr/actions/workflows/ci.yml).

The Windows walkthrough uses a disposable shell profile, the candidate's canonical installer and
release ZIP, an offline wheel directory and a loopback upstream fixture. The profile starts with no
Pyr home; the CLI downloads, checks, extracts and probes a real CPython fixture before creating the
app venv. Deno and system Python are absent from the user PATH. The runtime promotion test
substitutes upstream responses and forces a failed filesystem promotion, then executes real CPython
from the recovered location. These are automated checks. Human walkthrough completion and
verification of a publicly released candidate are open until performed. At release, the tagged
workflow tests the Windows ZIP, records its digest and publishes `SHA256SUMS`. Match the release
asset to that digest and tag before citing release evidence.
