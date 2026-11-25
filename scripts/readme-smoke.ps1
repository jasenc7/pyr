param([Parameter(Mandatory=$true)][string]$Package)
$ErrorActionPreference = 'Stop'
$readme = Get-Content README.md -Raw
$installer = Get-Content site/assets/install.ps1 -Raw
$candidateVersion = (Get-Content deno.json -Raw | ConvertFrom-Json).version
$zipName = 'pyr-windows-x86_64.zip'
$gitBin = Split-Path (Get-Command git.exe).Source
$profileRoot = Join-Path $Package 'walkthrough-profile'
New-Item -ItemType Directory $profileRoot | Out-Null
$env:TEMP = $env:TMP = $env:HOME = $env:USERPROFILE = $profileRoot
$env:APPDATA = $env:LOCALAPPDATA = $profileRoot
$env:GIT_CONFIG_NOSYSTEM = '1'
$env:GIT_CONFIG_GLOBAL = 'NUL'
$env:PIP_NO_INDEX = '1'
$env:PIP_FIND_LINKS = (New-Object System.Uri (Join-Path $Package 'wheels')).AbsoluteUri
$env:PIP_CONFIG_FILE = 'NUL'
$env:PIP_DISABLE_PIP_VERSION_CHECK = '1'
$env:GH_TOKEN = $env:GITHUB_TOKEN = $null
$env:Path = "$gitBin;$env:SystemRoot\System32;$env:SystemRoot"
if (Get-Command deno,python -ErrorAction SilentlyContinue) { throw 'developer tools on walkthrough PATH' }

# Return the candidate installer and release ZIP through the production command's
# PowerShell transport. The clean profile receives only the offline Python fixture.
function Invoke-RestMethod($Uri, $Headers) {
    if ($Uri -eq 'https://raw.githubusercontent.com/jasenc7/pyr/main/site/assets/install.ps1') {
        if (Test-Path $env:PYR_HOME) { throw 'Pyr home must start absent' }
        New-Item -ItemType Directory $env:PYR_HOME | Out-Null
        Copy-Item (Join-Path $Package 'python') (Join-Path $env:PYR_HOME 'python') -Recurse
        return $installer
    }
    if ($Uri -ne 'https://api.github.com/repos/jasenc7/pyr/releases/latest') { throw $Uri }
    return @{ tag_name = "v$candidateVersion"; assets = @(@{ name = $zipName }) }
}
function Invoke-WebRequest($Uri, $OutFile, [switch]$UseBasicParsing) {
    $filename = ($Uri -split '/')[-1]
    if ($filename -notin @('SHA256SUMS', $zipName) -or
        $Uri -ne "https://github.com/jasenc7/pyr/releases/download/v$candidateVersion/$filename") { throw $Uri }
    Copy-Item -LiteralPath (Join-Path $Package $filename) -Destination $OutFile
}
function Read-Block($name) {
    $pattern = '(?s)<!-- walkthrough:' + $name + ' -->\s*```powershell\s*\r?\n(.*?)\r?\n```'
    $match = [regex]::Match($readme, $pattern)
    if (!$match.Success) { throw "missing README walkthrough block $name" }
    return [scriptblock]::Create($match.Groups[1].Value)
}

$before = @(. (Read-Block 'install'))
$before | Out-Host
if ($before -notcontains $candidateVersion -or $before -notcontains 'hello world' -or
    $before[-2] -ne $true -or $before[-1] -ne $true) { throw 'step 1 output mismatch' }
if ((Get-FileHash (Get-Command pyr).Source).Hash -ne (Get-FileHash "$Package\pyr.exe").Hash) {
    throw 'release ZIP and installed executable differ'
}
$after = @(. (Read-Block 'clone'))
$after | Out-Host
if ($LASTEXITCODE -or $after -notcontains $false -or $after -notcontains 'idna==3.10' -or
    @($after | Where-Object { $_ -ceq '3.10' }).Count -ne 2) { throw 'step 2 output mismatch' }
$dirty = git status --porcelain
if ($LASTEXITCODE -or $dirty) { throw 'walkthrough changed tracked inputs' }
. (Read-Block 'cleanup')
if (Test-Path $work.FullName) { throw 'cleanup failed' }
Write-Host 'PASS README steps 1 and 2 and cleanup.'
