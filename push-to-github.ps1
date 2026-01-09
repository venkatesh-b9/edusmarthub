# PowerShell script to push code to GitHub
# EduSmartHub Repository

Write-Host "🚀 Preparing to push EduSmartHub to GitHub..." -ForegroundColor Cyan

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "❌ Git not initialized. Initializing..." -ForegroundColor Red
    git init
}

# Check remote
$remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "📡 Adding remote repository..." -ForegroundColor Yellow
    git remote add origin https://github.com/venkatesh-b9/edusmarthub.git
} else {
    Write-Host "✅ Remote already configured: $remote" -ForegroundColor Green
}

# Stage all changes
Write-Host "📦 Staging all changes..." -ForegroundColor Cyan
git add .

# Show status
Write-Host "`n📋 Current status:" -ForegroundColor Cyan
git status --short

# Commit
Write-Host "`n💾 Committing changes..." -ForegroundColor Cyan
$commitMessage = "Complete integration orchestration layer with production deployment setup

- Added MasterOrchestrator for unified service management
- Implemented DataFlowOrchestrator for seamless data flow
- Created RealTimeEventBus for event integration
- Added WorkflowIntegrator for complete workflow management
- Implemented ProductionMonitorService with AI insights
- Created frontend Dockerfile with nginx configuration
- Added comprehensive documentation
- Production-ready deployment configuration"

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed successfully!" -ForegroundColor Green
    
    # Push to GitHub
    Write-Host "`n🚀 Pushing to GitHub..." -ForegroundColor Cyan
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "🔗 Repository: https://github.com/venkatesh-b9/edusmarthub.git" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ Push failed. You may need to:" -ForegroundColor Red
        Write-Host "   1. Set up authentication (SSH key or Personal Access Token)" -ForegroundColor Yellow
        Write-Host "   2. Check your GitHub credentials" -ForegroundColor Yellow
        Write-Host "   3. Try: git push -u origin main" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Commit failed. Check for errors above." -ForegroundColor Red
}

Write-Host "`n✨ Done!" -ForegroundColor Cyan
