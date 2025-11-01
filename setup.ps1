# GetMeChai Localhost Setup Script
# Run this script to set up the entire project

Write-Host "🚀 GetMeChai Setup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green

# Check PostgreSQL
Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
$pgVersion = psql --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  PostgreSQL not found. Please install PostgreSQL 14+ from https://www.postgresql.org" -ForegroundColor Yellow
    Write-Host "   Continuing anyway..." -ForegroundColor Yellow
} else {
    Write-Host "✅ PostgreSQL found" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Installing Dependencies..." -ForegroundColor Cyan

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location getmechai-frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Install contract dependencies
Write-Host "Installing contract dependencies..." -ForegroundColor Yellow
Set-Location ..\getmechai-contracts
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Contract dependency installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Contract dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "🗄️  Setting up Database..." -ForegroundColor Cyan

# Create database
Write-Host "Creating database 'getmechai'..." -ForegroundColor Yellow
$createDb = "CREATE DATABASE getmechai;" | psql -U postgres 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database might already exist or PostgreSQL not configured" -ForegroundColor Yellow
}

# Generate Prisma client and push schema
Write-Host "Setting up Prisma..." -ForegroundColor Yellow
Set-Location ..\getmechai-frontend
npm run db:generate
npm run db:push
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database schema created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database setup incomplete. Check DATABASE_URL in .env.local" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Configuration Checklist:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Update .env.local with your settings:" -ForegroundColor White
Write-Host "   - DATABASE_URL (PostgreSQL connection string)" -ForegroundColor Gray
Write-Host "   - NEXT_PUBLIC_PINATA_API_KEY (Get from https://pinata.cloud)" -ForegroundColor Gray
Write-Host "   - NEXT_PUBLIC_PINATA_SECRET_KEY" -ForegroundColor Gray
Write-Host "   - PINATA_JWT" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy smart contract:" -ForegroundColor White
Write-Host "   cd getmechai-contracts" -ForegroundColor Gray
Write-Host "   npx hardhat node (in separate terminal)" -ForegroundColor Gray
Write-Host "   npx hardhat run scripts/deploy.js --network localhost" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local" -ForegroundColor White
Write-Host ""
Write-Host "4. Configure MetaMask:" -ForegroundColor White
Write-Host "   - Network: Hardhat Local" -ForegroundColor Gray
Write-Host "   - RPC: http://127.0.0.1:8545" -ForegroundColor Gray
Write-Host "   - Chain ID: 31337" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Start the application:" -ForegroundColor White
Write-Host "   cd getmechai-frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Setup Complete! Read LOCALHOST_SETUP.md for detailed instructions." -ForegroundColor Green
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - LOCALHOST_SETUP.md - Complete setup guide" -ForegroundColor Gray
Write-Host "   - SECURITY_AUDIT.md - Security features and audit" -ForegroundColor Gray
Write-Host ""
