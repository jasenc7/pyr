#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Repo = "jasenc7/pyr"
$InstallDir = if ($env:PYR_HOME) { Join-Path $env:PYR_HOME "bin" } else { Join-Path $env:USERPROFILE ".pyr\bin" }

$arch = (Get-CimInstance Win32_Processor).Architecture
switch ($arch) {
    9  { $target = "windows-x86_64" }   # x64
    12 { $target = "windows-aarch64" }  # ARM64
    default {
        Write-Error "unsupported arch: $arch"
        exit 1
    }
}

$Url = "https://github.com/$Repo/releases/latest/download/pyr-$target.zip"

Write-Host "installing pyr..."

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tmp | Out-Null

try {
    $zipPath = Join-Path $tmp "pyr.zip"
    Invoke-WebRequest -Uri $Url -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath $tmp -Force

    if (-not (Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }

    $src = Join-Path $tmp "pyr.exe"
    $dst = Join-Path $InstallDir "pyr.exe"
    Move-Item -Path $src -Destination $dst -Force

    Write-Host "installed to $dst"

    # check PATH
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$InstallDir*") {
        Write-Host ""
        Write-Host "add to your user PATH:"
        Write-Host "  [Environment]::SetEnvironmentVariable('Path', `"$InstallDir;`" + [Environment]::GetEnvironmentVariable('Path','User'), 'User')"
    }
}
finally {
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
