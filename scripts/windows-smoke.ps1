# Run on a disposable GitHub-hosted x64 runner. Supply the canonical installer
# with local release responses so this checks the candidate before publication.
$ErrorActionPreference = 'Stop'
$package = Join-Path $env:RUNNER_TEMP 'pyr-package'
New-Item -ItemType Directory $package | Out-Null
$exe = Join-Path $package 'pyr.exe'
$asset = 'pyr-windows-x86_64.zip'
$zip = Join-Path $package $asset
$version = (Get-Content -Raw deno.json | ConvertFrom-Json).version
if ($env:RUNNER_ARCH -ne 'X64') { throw 'expected x64 Windows' }
deno compile -A --target x86_64-pc-windows-msvc --output $exe main.ts
if ($LASTEXITCODE) { throw 'compilation failed' }
Compress-Archive -LiteralPath $exe -DestinationPath $zip
$checksum = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
"$checksum  $asset" | Set-Content -Encoding ascii (Join-Path $package 'SHA256SUMS')

function Invoke-RestMethod($Uri, $Headers) {
    if ($Uri -ne 'https://api.github.com/repos/jasenc7/pyr/releases/latest') { throw $Uri }
    return @{ tag_name = "v$version"; assets = @(@{ name = $asset }) }
}
function Invoke-WebRequest($Uri, $OutFile, [switch]$UseBasicParsing) {
    $filename = ($Uri -split '/')[-1]
    if ($filename -notin @('SHA256SUMS', 'pyr-windows-x86_64.zip') -or
        $Uri -ne "https://github.com/jasenc7/pyr/releases/download/v$version/$filename") { throw $Uri }
    Copy-Item -LiteralPath (Join-Path $package $filename) -Destination $OutFile
}
$env:PYR_HOME = Join-Path $package 'installed'
& ./site/assets/install.ps1
$installed = Join-Path $env:PYR_HOME 'bin\pyr.exe'
if ((Get-FileHash $exe).Hash -ne (Get-FileHash $installed).Hash) { throw 'installed bytes differ' }
if ((& $installed --version) -ne $version -or $LASTEXITCODE) { throw 'version mismatch' }
python scripts/clone_smoke.py $installed
if ($LASTEXITCODE) { throw 'clone smoke failed' }
