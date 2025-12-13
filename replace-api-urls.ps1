# PowerShell Script untuk mengganti semua hardcoded API URLs
# Jalankan: .\replace-api-urls.ps1

$rootPath = $PSScriptRoot
$srcPath = Join-Path $rootPath "src"

Write-Host "🔍 Scanning for hardcoded API URLs..." -ForegroundColor Cyan
Write-Host ""

# Pattern yang akan dicari dan diganti
$patterns = @(
    @{
        Old = "http://127.0.0.1:3333/api"
        Context = "API endpoints"
    },
    @{
        Old = "http://localhost:3333/api"
        Context = "API endpoints (localhost)"
    },
    @{
        Old = "http://127.0.0.1:3333"
        Context = "Base URL"
    },
    @{
        Old = "http://localhost:3333"
        Context = "Base URL (localhost)"
    }
)

# Fungsi untuk menambahkan import jika belum ada
function Add-ImportIfMissing {
    param (
        [string]$FilePath,
        [string]$ImportStatement
    )
    
    $content = Get-Content $FilePath -Raw
    
    # Check if import already exists
    if ($content -match [regex]::Escape($ImportStatement)) {
        return $false
    }
    
    # Find last import statement
    $lines = Get-Content $FilePath
    $lastImportIndex = -1
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^import ") {
            $lastImportIndex = $i
        }
    }
    
    if ($lastImportIndex -ge 0) {
        # Add after last import
        $lines = $lines[0..$lastImportIndex] + $ImportStatement + $lines[($lastImportIndex + 1)..($lines.Count - 1)]
        $lines | Set-Content $FilePath
        return $true
    }
    
    return $false
}

# Fungsi untuk mengganti URL
function Replace-ApiUrl {
    param (
        [string]$FilePath
    )
    
    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    $modified = $false
    $needsImport = $false
    
    # Ganti fetch dengan buildApiUrl untuk /api endpoints
    if ($content -match "fetch\s*\(\s*[`'""]http://(?:127\.0\.0\.1|localhost):3333/api/([^`'""\)]+)[`'""]") {
        $content = $content -replace "fetch\s*\(\s*[`'""]http://(?:127\.0\.0\.1|localhost):3333/api/([^`'""\)]+)[`'""]", "fetch(buildApiUrl('`$1')"
        $needsImport = $true
        $modified = $true
    }
    
    # Ganti string literal URL untuk /api endpoints
    if ($content -match "[`'""]http://(?:127\.0\.0\.1|localhost):3333/api/([^`'""\?]+)(?:\?[^`'""]*)?" -and $content -notmatch "fetch") {
        $content = $content -replace "[`'""]http://(?:127\.0\.0\.1|localhost):3333/api/([^`'""\?]+)", "buildApiUrl('`$1')"
        $needsImport = $true
        $modified = $true
    }
    
    # Ganti untuk non-API endpoints (login, logout, dll)
    if ($content -match "fetch\s*\(\s*[`'""]http://(?:127\.0\.0\.1|localhost):3333/(?!api)([^`'""\)]+)[`'""]") {
        $content = $content -replace "fetch\s*\(\s*[`'""]http://(?:127\.0\.0\.1|localhost):3333/(?!api)([^`'""\)]+)[`'""]", "fetch(`"`${API_BASE_URL}/`$1`")"
        $needsImport = $true
        $modified = $true
    }
    
    if ($modified) {
        # Add import if needed
        if ($needsImport) {
            # Determine relative path to config
            $relPath = $FilePath.Replace($srcPath, "").Replace("\", "/")
            $depth = ($relPath.Split('/').Count - 2)
            $importPath = ("../" * $depth) + "config/api"
            
            $importStatement = "import { API_BASE_URL, buildApiUrl, getAuthHeaders } from '$importPath';"
            
            # Check if file is TypeScript/React
            if ($FilePath -match "\.(ts|tsx)$") {
                Add-ImportIfMissing -FilePath $FilePath -ImportStatement $importStatement | Out-Null
            }
        }
        
        # Save modified content
        $content | Set-Content $FilePath -NoNewline
        return $true
    }
    
    return $false
}

# Scan all TypeScript and TSX files
$files = Get-ChildItem -Path $srcPath -Include *.ts,*.tsx -Recurse | Where-Object {
    $_.FullName -notmatch "node_modules" -and
    $_.FullName -notmatch "dist" -and
    $_.FullName -notmatch ".git"
}

$totalFiles = 0
$modifiedFiles = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file contains hardcoded URLs
    $hasHardcodedUrl = $false
    foreach ($pattern in $patterns) {
        if ($content -match [regex]::Escape($pattern.Old)) {
            $hasHardcodedUrl = $true
            break
        }
    }
    
    if ($hasHardcodedUrl) {
        $totalFiles++
        Write-Host "📝 Processing: $($file.Name)" -ForegroundColor Yellow
        
        if (Replace-ApiUrl -FilePath $file.FullName) {
            $modifiedFiles += $file.FullName
            Write-Host "   ✅ Updated" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Needs manual review" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Files with hardcoded URLs: $totalFiles" -ForegroundColor White
Write-Host "Files auto-updated: $($modifiedFiles.Count)" -ForegroundColor Green
Write-Host "Files needing manual review: $($totalFiles - $modifiedFiles.Count)" -ForegroundColor Yellow
Write-Host ""

if ($modifiedFiles.Count -gt 0) {
    Write-Host "✅ Modified files:" -ForegroundColor Green
    foreach ($file in $modifiedFiles) {
        Write-Host "   - $($file.Replace($srcPath, 'src'))" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "⚠️  Please review changes and test thoroughly before committing!" -ForegroundColor Yellow
Write-Host "💡 Tip: Use 'git diff' to review all changes" -ForegroundColor Cyan
Write-Host ""
