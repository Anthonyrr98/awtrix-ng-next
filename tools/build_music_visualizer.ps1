param(
    [string]$Python = "python",
    [string]$OutputDirectory = "dist/music-visualizer"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$venv = Join-Path $root ".build/music-visualizer-venv"
$requirements = Join-Path $PSScriptRoot "music-visualizer-requirements.txt"
$entryPoint = Join-Path $PSScriptRoot "music_visualizer.py"
$output = [System.IO.Path]::GetFullPath((Join-Path $root $OutputDirectory))
$work = Join-Path $root ".build/music-visualizer-work"
$spec = Join-Path $root ".build/music-visualizer-spec"

if (-not (Test-Path (Join-Path $venv "Scripts/python.exe"))) {
    & $Python -m venv $venv
}

$venvPython = Join-Path $venv "Scripts/python.exe"
& $venvPython -m pip install --disable-pip-version-check -r $requirements
if ($LASTEXITCODE -ne 0) {
    throw "Dependency installation failed with exit code $LASTEXITCODE"
}
& $venvPython -m PyInstaller `
    --noconfirm `
    --clean `
    --onefile `
    --console `
    --name "awtrix-music-visualizer" `
    --distpath $output `
    --workpath $work `
    --specpath $spec `
    --collect-all soundcard `
    $entryPoint
if ($LASTEXITCODE -ne 0) {
    throw "PyInstaller failed with exit code $LASTEXITCODE"
}

$exe = Join-Path $output "awtrix-music-visualizer.exe"
if (-not (Test-Path $exe)) {
    throw "Build completed without producing $exe"
}

Write-Host "Built $exe"
