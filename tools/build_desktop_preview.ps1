param(
    [string]$OutputDirectory = "dist/desktop-preview"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $PSScriptRoot "awtrix_desktop_preview.cs"
$output = [System.IO.Path]::GetFullPath((Join-Path $root $OutputDirectory))
$compiler = Join-Path $env:WINDIR "Microsoft.NET/Framework64/v4.0.30319/csc.exe"

if (-not (Test-Path $compiler)) {
    throw ".NET Framework 4 C# compiler not found: $compiler"
}
New-Item -ItemType Directory -Force -Path $output | Out-Null
$exe = Join-Path $output "awtrix-desktop-preview.exe"

& $compiler /nologo /optimize+ /target:winexe /platform:anycpu /out:$exe `
    /reference:System.dll `
    /reference:System.Drawing.dll `
    /reference:System.Windows.Forms.dll `
    /reference:System.Web.Extensions.dll `
    $source
if ($LASTEXITCODE -ne 0) {
    throw "Desktop preview build failed with exit code $LASTEXITCODE"
}
if (-not (Test-Path $exe)) {
    throw "Build completed without producing $exe"
}

$smoke = Start-Process -FilePath $exe -ArgumentList "--smoke-test" -Wait -PassThru -WindowStyle Hidden
if ($smoke.ExitCode -ne 0) {
    throw "Desktop preview smoke test failed with exit code $($smoke.ExitCode)"
}

Write-Host "Built $exe ($((Get-Item $exe).Length) bytes)"
