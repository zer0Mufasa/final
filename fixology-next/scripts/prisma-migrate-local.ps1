# Runs Prisma migrations using variables from .env.local (preferred) and .env (fallback).
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\\scripts\\prisma-migrate-local.ps1
#
# This is helpful when Prisma CLI loads .env by default but your real creds are in .env.local.

$ErrorActionPreference = "Stop"

function Load-EnvFile([string]$Path, [bool]$Override = $false) {
  if (-not (Test-Path $Path)) { return }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0) { return }
    if ($line.StartsWith("#")) { return }

    # support: KEY=VALUE (VALUE may be quoted)
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }

    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()

    if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
      $val = $val.Substring(1, $val.Length - 2)
    }

    if ($key.Length -gt 0) {
      $existing = [System.Environment]::GetEnvironmentVariable($key, "Process")
      if ($Override -or [string]::IsNullOrEmpty($existing)) {
        [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
      }
    }
  }
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# Load .env first, then let .env.local override it
Load-EnvFile (Join-Path $root ".env") $false
Load-EnvFile (Join-Path $root ".env.local") $true

Write-Host "Running: npx prisma migrate deploy" -ForegroundColor Cyan
npx prisma migrate deploy


