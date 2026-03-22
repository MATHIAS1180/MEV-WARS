# Install Solana CLI manually
$version = "v2.1.13"
$url = "https://github.com/anza-xyz/agave/releases/download/$version/solana-release-x86_64-pc-windows-msvc.tar.bz2"
$downloadPath = "$env:TEMP\solana.tar.bz2"
$extractPath = "$env:USERPROFILE\.solana"

Write-Host "Downloading Solana $version..."
Invoke-WebRequest -Uri $url -OutFile $downloadPath -UseBasicParsing

Write-Host "Extracting..."
New-Item -ItemType Directory -Path $extractPath -Force | Out-Null

# Extract tar.bz2 using 7zip if available, otherwise use tar
if (Get-Command 7z -ErrorAction SilentlyContinue) {
    7z x $downloadPath -o"$env:TEMP" -y
    7z x "$env:TEMP\solana-release-x86_64-pc-windows-msvc.tar" -o"$extractPath" -y
} else {
    tar -xjf $downloadPath -C $extractPath
}

Write-Host "Solana installed to $extractPath"
Write-Host "Add to PATH: $extractPath\solana-release\bin"
