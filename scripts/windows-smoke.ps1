# Run on a disposable GitHub-hosted x64 runner. Supply the canonical installer
# with local release responses so this checks the candidate before publication.
param([string]$ReleaseArchive)
$ErrorActionPreference = 'Stop'
$package = Join-Path $env:RUNNER_TEMP 'pyr-package'
New-Item -ItemType Directory $package | Out-Null
$exe = Join-Path $package 'pyr.exe'
$asset = 'pyr-windows-x86_64.zip'
$zip = Join-Path $package $asset
$version = (Get-Content -Raw deno.json | ConvertFrom-Json).version
if ($env:RUNNER_ARCH -ne 'X64') { throw 'expected x64 Windows' }
if ($ReleaseArchive) {
    Copy-Item -LiteralPath $ReleaseArchive -Destination $zip
    Expand-Archive -LiteralPath $zip -DestinationPath $package
} else {
    deno compile -A --target x86_64-pc-windows-msvc --output $exe main.ts
    if ($LASTEXITCODE) { throw 'compilation failed' }
    Compress-Archive -LiteralPath $exe -DestinationPath $zip
}
$checksum = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
"$checksum  $asset" | Set-Content -Encoding ascii (Join-Path $package 'SHA256SUMS')

$wheelDir = Join-Path $package 'wheels'
python -m pip download --disable-pip-version-check --only-binary=:all: --no-deps --dest $wheelDir idna==3.10
if ($LASTEXITCODE) { throw 'failed to stage sample wheel' }
$wheel = Join-Path $wheelDir 'idna-3.10-py3-none-any.whl'
if ((Get-FileHash $wheel -Algorithm SHA256).Hash -ne '946d195a0d259cbba61165e88e65941f16e9b36ea6ddb97f00452bae8b1287d3') {
    throw 'unexpected sample wheel'
}
# Provision an offline interpreter fixture before hiding both developer tools.
$runtime = Join-Path $package 'python'
python -m venv --without-pip $runtime
if ($LASTEXITCODE) { throw 'failed to stage CPython' }
Copy-Item "$runtime\Scripts\python.exe" "$runtime\python.exe"
& "$runtime\python.exe" -c "import platform;print(platform.python_version())" | Set-Content -Encoding ascii "$runtime\.version"

powershell -NoProfile -NonInteractive -File ./scripts/readme-smoke.ps1 -Package $package
if ($LASTEXITCODE) { throw 'README walkthrough failed' }
python scripts/clone_smoke.py $exe
if ($LASTEXITCODE) { throw 'clone smoke failed' }
