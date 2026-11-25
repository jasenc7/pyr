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
$wheels = @{
    '3.10' = '946d195a0d259cbba61165e88e65941f16e9b36ea6ddb97f00452bae8b1287d3'
    '3.11' = '771a87f49d9defaf64091e6e6fe9c18d4833f140bd19464795bc32d966ca37ea'
}
foreach ($pin in $wheels.Keys) {
    python -m pip download --disable-pip-version-check --only-binary=:all: --no-deps --dest $wheelDir "idna==$pin"
    if ($LASTEXITCODE) { throw 'failed to stage sample wheel' }
    $wheel = Join-Path $wheelDir "idna-$pin-py3-none-any.whl"
    if ((Get-FileHash $wheel -Algorithm SHA256).Hash -ne $wheels[$pin]) { throw 'unexpected wheel' }
}
if (!(Get-Command openssl -ErrorAction SilentlyContinue)) {
    $env:Path += ";$env:ProgramFiles\Git\usr\bin"
}
$fixture = Start-Process -FilePath (Get-Command python).Source -ArgumentList @(
    'scripts/runtime_fixture.py', ('"{0}"' -f $package)
) -NoNewWindow -PassThru
try {
    $ready = Join-Path $package 'port'
    for ($i = 0; $i -lt 120 -and !(Test-Path $ready); $i++) {
        if ($fixture.HasExited) { throw "runtime fixture exited with $($fixture.ExitCode)" }
        Start-Sleep -Milliseconds 250
    }
    if (!(Test-Path $ready)) { throw 'runtime fixture did not start' }
    powershell -NoProfile -NonInteractive -File ./scripts/readme-smoke.ps1 -Package $package
    if ($LASTEXITCODE) { throw 'README walkthrough failed' }
} finally {
    if (!$fixture.HasExited) { $fixture.Kill(); $fixture.WaitForExit() }
}
python scripts/clone_smoke.py $exe
if ($LASTEXITCODE) { throw 'clone smoke failed' }
