# -----------------------------------------------------------------------------
#  CELESTIA - one-shot build & setup for Windows 10 / 11
#
#  Paste this into PowerShell (no admin needed):
#
#    irm https://raw.githubusercontent.com/zealzedsec/Celestia/main/scripts/setup-windows.ps1 | iex
#
#  ...or, from inside a clone:
#
#    powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
#
#  It installs Git and Node.js LTS if they are missing (via winget), fetches or
#  updates the source, runs the tests, builds the desktop installer, installs
#  CELESTIA for your user (Start menu + desktop shortcut) and launches it.
#  Run it again any time to update.
#
#  Options - set before running, e.g.  $env:CELESTIA_MODE = "web"
#    $env:CELESTIA_DIR   where to clone the source   (default: $HOME\Celestia)
#    $env:CELESTIA_REPO  clone from elsewhere, e.g. an SSH URL
#    $env:CELESTIA_MODE  "web" builds the web server instead of the desktop app
#    $env:SKIP_DEPS      "1" = don't install Git / Node.js
#    $env:SKIP_TESTS     "1" = skip the unit tests
#    $env:SKIP_INSTALL   "1" = build the installer only, don't install it
# -----------------------------------------------------------------------------

# Path of this file when run with -File (empty when piped through iex)
$celestiaSelf = $PSCommandPath

# Everything runs inside a script block so an error returns you to the prompt
# instead of closing the window (which a bare `exit` would do under `iex`).
& {
  $ErrorActionPreference = 'Stop'
  $ProgressPreference = 'SilentlyContinue'

  $repo = if ($env:CELESTIA_REPO) { $env:CELESTIA_REPO } else { 'https://github.com/zealzedsec/Celestia.git' }
  $dir  = if ($env:CELESTIA_DIR)  { $env:CELESTIA_DIR }  else { Join-Path $HOME 'Celestia' }
  $mode = if ($env:CELESTIA_MODE) { $env:CELESTIA_MODE } else { 'desktop' }
  $env:NEXT_TELEMETRY_DISABLED = '1'

  function Step([string]$msg) { Write-Host ''; Write-Host "* $msg" -ForegroundColor Yellow }
  function Info([string]$msg) { Write-Host "  $msg" -ForegroundColor DarkGray }

  # Run a native command and stop on a non-zero exit code (PowerShell 5.1 does not do this itself)
  function Run([string]$exe, [string[]]$argList) {
    & $exe @argList
    if ($LASTEXITCODE -ne 0) { throw "'$exe $($argList -join ' ')' failed (exit code $LASTEXITCODE)" }
  }

  function Update-SessionPath {
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  }

  function Test-NodeVersion {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $false }
    & node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a>22||(a===22&&b>=12)?0:1)"
    return ($LASTEXITCODE -eq 0)
  }

  try {
    Write-Host ''
    Write-Host "   C E L E S T I A   -   living observatory setup ($mode)" -ForegroundColor Magenta

    # -- 1. tools ----------------------------------------------------------------
    if (-not $env:SKIP_DEPS) {
      $missing = @()
      if (-not (Get-Command git -ErrorAction SilentlyContinue)) { $missing += 'Git.Git' }
      if (-not (Get-Command node -ErrorAction SilentlyContinue)) { $missing += 'OpenJS.NodeJS.LTS' }
      if ($missing.Count -gt 0) {
        if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
          throw 'winget is not available. Install Git (https://git-scm.com) and Node.js LTS (https://nodejs.org), then run this again.'
        }
        foreach ($id in $missing) {
          Step "Installing $id (winget)"
          Run 'winget' @('install', '--id', $id, '--exact', '--source', 'winget', '--silent', '--accept-source-agreements', '--accept-package-agreements')
        }
        Update-SessionPath
      }
    }
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is not installed (or not on PATH yet - open a new PowerShell window and run this again).' }
    if (-not (Test-NodeVersion)) { throw 'Node.js 22.12 or newer is required. Update it with:  winget upgrade OpenJS.NodeJS.LTS' }
    Info "node $(& node -v) / npm $(& npm.cmd -v) / $(& git --version)"

    # -- 2. source ---------------------------------------------------------------
    $fromClone = $false
    if ($celestiaSelf) {
      $candidate = Split-Path -Parent (Split-Path -Parent $celestiaSelf)
      $pkg = Join-Path $candidate 'package.json'
      if ((Test-Path $pkg) -and ((Get-Content $pkg -Raw) -match '"name":\s*"celestia"')) { $dir = $candidate; $fromClone = $true }
    }
    if ($fromClone) {
      Step "Using the source in $dir"
    } elseif (Test-Path (Join-Path $dir '.git')) {
      Step "Updating the source in $dir"
      Run 'git' @('-C', $dir, 'pull', '--ff-only')
    } else {
      Step "Cloning CELESTIA into $dir"
      Run 'git' @('clone', '--depth', '1', $repo, $dir)
    }
    Set-Location $dir

    # -- 3. dependencies ---------------------------------------------------------
    Step 'Installing npm dependencies (first run downloads Electron, ~100 MB)'
    Run 'npm.cmd' @('ci', '--no-audit', '--no-fund')
    if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }

    if (-not $env:SKIP_TESTS) {
      Step 'Running the test suite'
      Run 'npm.cmd' @('test', '--silent')
    }

    # -- 4. build ----------------------------------------------------------------
    if ($mode -eq 'web') {
      Step 'Building the web server'
      Run 'npm.cmd' @('run', 'db:push')
      Run 'npm.cmd' @('run', 'build')
      $db = (Join-Path $dir 'db\custom.db') -replace '\\', '/'
      Write-Host ''
      Write-Host 'Built. Start it with:' -ForegroundColor Green
      Write-Host "    cd `"$dir`"; `$env:DATABASE_URL = `"file:$db`"; npm.cmd start"
      Write-Host '  then open http://localhost:3000'
      return
    }

    Step 'Building the desktop app (Next.js -> standalone server -> Windows installer)'
    if (Test-Path 'release') { Remove-Item 'release' -Recurse -Force }
    Run 'npm.cmd' @('run', 'build')
    Run 'npm.cmd' @('run', 'desktop:prepare')
    Run 'npx.cmd' @('electron-builder', '--win', 'nsis', '--publish', 'never')

    $installer = Get-ChildItem 'release' -Filter 'CELESTIA-*-win-*.exe' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $installer) { throw 'No installer was produced - see the electron-builder output above.' }
    Info ("built {0} ({1:N0} MB)" -f $installer.Name, ($installer.Length / 1MB))

    # -- 5. install & launch -----------------------------------------------------
    if ($env:SKIP_INSTALL) {
      Write-Host ''
      Write-Host "Done. Installer: $($installer.FullName)" -ForegroundColor Green
      return
    }
    Step 'Installing CELESTIA for your user (Start menu + desktop shortcut)'
    $proc = Start-Process -FilePath $installer.FullName -ArgumentList '/S' -Wait -PassThru
    if ($proc.ExitCode -ne 0) { throw "The installer exited with code $($proc.ExitCode)" }

    $exe = Join-Path $env:LOCALAPPDATA 'Programs\CELESTIA\CELESTIA.exe'
    Write-Host ''
    Write-Host 'Done. CELESTIA is in your Start menu and on your desktop.' -ForegroundColor Green
    Write-Host '  Your journal & charts live in %APPDATA%\CELESTIA - back them up from Settings -> Your archive.'
    if (Test-Path $exe) {
      Write-Host '  Launching...'
      Start-Process -FilePath $exe
    }
  }
  catch {
    Write-Host ''
    Write-Host "Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host '  Scroll up for details. Re-running the same command is safe.' -ForegroundColor DarkGray
  }
}
