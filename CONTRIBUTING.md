# Contributing to MEDORA

## 🌟 Welcome Contributors!

Thank you for your interest in contributing to **MEDORA**!  
This document outlines our contribution guidelines and collaboration standards.

---

## 📜 Code of Conduct

All contributors must adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).  
Please read it before participating.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm
- Git
- Firebase account
- Cloudinary account

### Setup Steps
```bash
# 1. Fork the repository

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/medora.git
cd medora

# 3. Install dependencies
npm install

# 4. Set up environment variables
# Copy .env.example to .env.local and fill in your values

# 5. Run development server
npm run dev
```

# 🌿 Branch Naming Rules
 ```bash
 [work-type]/[brief-description]
```
## Work Types

- feature/ – New features
- fix/ – Bug fixes
- docs/ – Documentation updates
-backend/ – Backend changes
- ui/ – UI/UX changes
- security/ – Security updates

## Example 
```bash
feature/pdf-upload
fix/auth-bug
docs/update-readme
backend/api-integration
ui/dashboard-redesign
security/file-validation
```
# 💬 Commit Message Rules
 ```bash
 [WORK-TYPE-ALL_CAPS]-[COMMIT-NUMBER]:brief-description
```
### Rules

1. WORK-TYPE must be ALL CAPS
2. COMMIT-NUMBER should be sequential (01, 02, 03…)
3. Use hyphens, no spaces
### Example Commits
```bash
- [BACKEND]-[01]:Server-side-changes
- [FRONTEND]-[02]:Frontend-logic
- [UI]-[03]:-Styling-and-components
- [DOCS]-[04]:Documentation
- [FIX]-[05]:Bug-fixes
- [SECURITY]-[06]:Security-updates
- [TEST]-[07]:Testing
- [CONFIG]-[08]:Configuration-changes
```
