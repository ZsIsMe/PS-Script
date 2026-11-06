param(
    [string]$PhotoshopPath = 'E:\ado\Adobe Photoshop 2026'
)

$ErrorActionPreference = 'Stop'
$scriptDirectory = Join-Path $PhotoshopPath 'Presets\Scripts'
$buildDirectory = Join-Path $PSScriptRoot 'build'
$links = @(
    @{ Name = 'LabelPlus_Ps_Script_ZS.jsx'; Type = 'SymbolicLink' },
    @{ Name = 'ps_script_res'; Type = 'Junction' }
)

if (-not (Test-Path -LiteralPath $scriptDirectory -PathType Container)) {
    throw "Photoshop script directory not found: $scriptDirectory"
}

# Check every destination before making changes. Never replace existing files.
foreach ($link in $links) {
    $targetPath = Join-Path $buildDirectory $link.Name
    $linkPath = Join-Path $scriptDirectory $link.Name
    if (-not (Test-Path -LiteralPath $targetPath)) { throw "Build output not found: $targetPath" }
    $existing = Get-Item -LiteralPath $linkPath -Force -ErrorAction SilentlyContinue
    if ($existing -and ($existing.LinkType -ne $link.Type -or $existing.Target -ne $targetPath)) {
        throw "Destination already exists; refusing to replace it: $linkPath"
    }
}

foreach ($link in $links) {
    $targetPath = Join-Path $buildDirectory $link.Name
    $linkPath = Join-Path $scriptDirectory $link.Name
    if (-not (Get-Item -LiteralPath $linkPath -Force -ErrorAction SilentlyContinue)) {
        New-Item -ItemType $link.Type -Path $linkPath -Target $targetPath | Out-Null
    }
    Get-Item -LiteralPath $linkPath -Force | Select-Object FullName, LinkType, Target
}
