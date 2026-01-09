# Git Setup and Push Instructions

## Quick Push Script

Run the PowerShell script to automatically push to GitHub:

```powershell
.\push-to-github.ps1
```

## Manual Steps

### 1. Check Git Status

```powershell
git status
```

### 2. Add All Files

```powershell
git add .
```

### 3. Commit Changes

```powershell
git commit -m "Complete integration orchestration layer with production deployment setup"
```

### 4. Add Remote (if not already added)

```powershell
git remote add origin https://github.com/venkatesh-b9/edusmarthub.git
```

### 5. Push to GitHub

```powershell
git push -u origin main
```

## Authentication

If you encounter authentication issues:

### Option 1: Personal Access Token (Recommended)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when pushing

### Option 2: SSH Key

1. Generate SSH key: `ssh-keygen -t ed25519 -C "your_email@example.com"`
2. Add to GitHub: Settings → SSH and GPG keys → New SSH key
3. Change remote URL: `git remote set-url origin git@github.com:venkatesh-b9/edusmarthub.git`

## Verify Push

After pushing, verify at:
https://github.com/venkatesh-b9/edusmarthub

## Repository Structure

The repository includes:
- ✅ Complete frontend application
- ✅ Complete backend application
- ✅ AI services
- ✅ Integration orchestration layer
- ✅ Docker configurations
- ✅ Comprehensive documentation
