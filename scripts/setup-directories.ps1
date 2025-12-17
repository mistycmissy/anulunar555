# AnuLunar555 Directory Setup Script
# Run this in PowerShell from your AnuLunar555 directory

Write-Host "🌟 Setting up AnuLunar555 directory structure..." -ForegroundColor Cyan

# Create main directories
New-Item -ItemType Directory -Force -Path "src\components\quiz"
New-Item -ItemType Directory -Force -Path "src\components\reports"
New-Item -ItemType Directory -Force -Path "src\pages"
New-Item -ItemType Directory -Force -Path "src\utils" 
New-Item -ItemType Directory -Force -Path "src\types"
New-Item -ItemType Directory -Force -Path "data\astrology"
New-Item -ItemType Directory -Force -Path "data\celtic"
New-Item -ItemType Directory -Force -Path "data\human-design"
New-Item -ItemType Directory -Force -Path "data\numerology"
New-Item -ItemType Directory -Force -Path "data\tarot"
New-Item -ItemType Directory -Force -Path "data\lunaris"
New-Item -ItemType Directory -Force -Path "data\quiz-templates"
New-Item -ItemType Directory -Force -Path "data\reports"
New-Item -ItemType Directory -Force -Path "lib\calculations"
New-Item -ItemType Directory -Force -Path "lib\processors"
New-Item -ItemType Directory -Force -Path "lib\generators"
New-Item -ItemType Directory -Force -Path "public\demo"
New-Item -ItemType Directory -Force -Path "docs"

Write-Host "✅ Directory structure created!" -ForegroundColor Green
Write-Host "📁 Next: Copy your proprietary database files to the data/ directories" -ForegroundColor Yellow
Write-Host "🚀 Ready for development!" -ForegroundColor Magenta
