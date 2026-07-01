$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$client = Join-Path $root '.tools\bin\tunnel-client.exe'
$profileDir = Join-Path $root '.chatgpt-tunnel'

if (-not (Test-Path -LiteralPath $client)) {
  throw 'Official tunnel-client is missing from .tools\bin.'
}
if (-not $env:CONTROL_PLANE_API_KEY) {
  throw 'Set CONTROL_PLANE_API_KEY to the OpenAI tunnel runtime API key for this terminal session.'
}

& $client run --profile med-research --profile-dir $profileDir
exit $LASTEXITCODE
