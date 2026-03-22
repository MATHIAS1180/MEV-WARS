# Start Solana Test Validator
$env:PATH = "$env:USERPROFILE\.solana\solana-release\bin;$env:USERPROFILE\.cargo\bin;$env:PATH"

# Create ledger directory if it doesn't exist
$ledgerPath = "$env:USERPROFILE\.solana-ledger"
if (Test-Path $ledgerPath) {
    Remove-Item -Recurse -Force $ledgerPath
}
New-Item -ItemType Directory -Path $ledgerPath -Force | Out-Null

Write-Host "Starting Solana Test Validator on localhost:8899..."
Write-Host "Ledger: $ledgerPath"
Write-Host ""

solana-test-validator --ledger $ledgerPath --rpc-port 8899 --quiet
