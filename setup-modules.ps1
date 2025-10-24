# Tutor Scene - Complete Module Generator
# Run this to generate all required modules

Write-Host "Tutor Scene - Generating All Modules" -ForegroundColor Green
Write-Host ""

if (!(Test-Path "package.json")) {
    Write-Host "Error: package.json not found" -ForegroundColor Red
    exit 1
}

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Generating modules..." -ForegroundColor Yellow

$modules = @(
    "subjects",
    "availability",
    "bookings",
    "payments",
    "video-sessions",
    "messaging",
    "reviews",
    "kyc",
    "background-checks",
    "notifications",
    "file-upload",
    "promo-codes",
    "admin",
    "support"
)

foreach ($module in $modules) {
    Write-Host "Generating $module..." -ForegroundColor Cyan
    
    nest g module modules/$module --no-spec 2>$null
    nest g controller modules/$module --no-spec 2>$null
    nest g service modules/$module --no-spec 2>$null
    
    $dtoPath = "src/modules/$module/dto"
    if (!(Test-Path $dtoPath)) {
        New-Item -ItemType Directory -Path $dtoPath -Force | Out-Null
    }
    
    Write-Host "  $module created" -ForegroundColor Green
}

Write-Host ""
Write-Host "All modules generated!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run database-schema.sql in PostgreSQL"
Write-Host "2. Configure .env with API keys"
Write-Host "3. Run: npm run start:dev"
Write-Host ""
