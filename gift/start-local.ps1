$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 4173
$url = "http://localhost:$port"

Write-Host "Starting local server for /gift at $url"
Write-Host "Press Ctrl+C to stop"

Start-Process $url | Out-Null
Set-Location $root
python -m http.server $port
