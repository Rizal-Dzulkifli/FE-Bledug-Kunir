# Update semua file yang masih punya hardcoded URLs
# Jalankan: cd "d:\Pa\New folder\FE"; .\update-remaining-urls.ps1

Write-Host "🔄 Updating remaining files with hardcoded URLs..." -ForegroundColor Cyan
Write-Host ""

$updated = 0

# NamaProduk.tsx
Write-Host "Processing NamaProduk.tsx..." -ForegroundColor Yellow
$file = "src\pages\DataTables\NamaProduk.tsx"
if (Test-Path $file) {
    $content = Get-Content $file -Raw
    $content = $content -replace "fetch\('http://127\.0\.0\.1:3333/api/nama-produk\?limit=1000'", "fetch(buildApiUrl('nama-produk?limit=1000')"
    $content = $content -replace "fetch\('http://127\.0\.0\.1:3333/api/nama-produk/generate-kode'", "fetch(buildApiUrl('nama-produk/generate-kode')"
    $content = $content -replace "http://127\.0\.0\.1:3333/api/nama-produk/\$\{params\.id_produk\}", "buildApiUrl(\`nama-produk/\${params.id_produk}\`)"
    $content = $content -replace "'http://127\.0\.0\.1:3333/api/nama-produk'", "buildApiUrl('nama-produk')"
    $content = $content -replace "http://127\.0\.0\.1:3333/api/nama-produk/\$\{id_produk\}", "buildApiUrl(\`nama-produk/\${id_produk}\`)"
    $content | Set-Content $file -NoNewline
    $updated++
    Write-Host "✅ Updated" -ForegroundColor Green
}

# NamaBarangMentah.tsx
Write-Host "Processing NamaBarangMentah.tsx..." -ForegroundColor Yellow
$file = "src\pages\DataTables\NamaBarangMentah.tsx"
if (Test-Path $file) {
    $content = Get-Content $file -Raw
    $content = $content -replace "fetch\('http://127\.0\.0\.1:3333/api/nama-barang-mentah\?limit=1000'", "fetch(buildApiUrl('nama-barang-mentah?limit=1000')"
    $content = $content -replace "fetch\('http://127\.0\.0\.1:3333/api/nama-barang-mentah/generate-kode'", "fetch(buildApiUrl('nama-barang-mentah/generate-kode')"
    $content = $content -replace "http://127\.0\.0\.1:3333/api/nama-barang-mentah/\$\{params\.id_bm\}", "buildApiUrl(\`nama-barang-mentah/\${params.id_bm}\`)"
    $content = $content -replace "'http://127\.0\.0\.1:3333/api/nama-barang-mentah'", "buildApiUrl('nama-barang-mentah')"
    $content = $content -replace "http://127\.0\.0\.1:3333/api/nama-barang-mentah/\$\{id_bm\}", "buildApiUrl(\`nama-barang-mentah/\${id_bm}\`)"
    $content | Set-Content $file -NoNewline
    $updated++
    Write-Host "✅ Updated" -ForegroundColor Green
}

# Asset.tsx  
Write-Host "Processing Asset.tsx..." -ForegroundColor Yellow
$file = "src\pages\DataTables\Asset.tsx"
if (Test-Path $file) {
    $content = Get-Content $file -Raw
    $content = $content -replace "fetch\('http://127\.0\.0\.1:3333/api/assets\?limit=1000'", "fetch(buildApiUrl('assets?limit=1000')"
    $content = $content -replace "http://127\.0\.0\.1:3333/api/assets/\$\{params\.id_asset\}", "buildApiUrl(\`assets/\${params.id_asset}\`)"
    $content = $content -replace "'http://127\.0\.0\.1:3333/api/assets'", "buildApiUrl('assets')"
    $content = $content -replace "http://127\.0\.0\.1:3333/api/assets/\$\{id\}", "buildApiUrl(\`assets/\${id}\`)"
    $content | Set-Content $file -NoNewline
    $updated++
    Write-Host "✅ Updated" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Successfully updated $updated files!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️ Note: Some files may need manual review for complex URLs" -ForegroundColor Yellow
