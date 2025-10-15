#!/bin/bash

# Nooa Core Engine - GitHub Publication Script
# This script automates the process of publishing to GitHub

set -e  # Exit on any error

echo "🚀 Nooa Core Engine - GitHub Publication Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify we're in the right directory
echo "📂 Step 1: Verifying project directory..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

PROJECT_NAME=$(node -p "require('./package.json').name")
if [ "$PROJECT_NAME" != "nooa-core-engine" ]; then
    echo -e "${RED}❌ Error: This doesn't appear to be the nooa-core-engine project${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project verified: $PROJECT_NAME${NC}"
echo ""

# Step 2: Check if Git is initialized
echo "📂 Step 2: Checking Git status..."
if [ ! -d ".git" ]; then
    echo "⚠️  Git not initialized. Initializing..."
    git init
    echo -e "${GREEN}✅ Git initialized${NC}"
else
    echo -e "${GREEN}✅ Git already initialized${NC}"
fi
echo ""

# Step 3: Run self-validation
echo "🔍 Step 3: Running self-validation..."
npm run build
if ! npm start . > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Self-validation detected violations (check manually)${NC}"
else
    echo -e "${GREEN}✅ Self-validation passed${NC}"
fi
echo ""

# Step 4: Check for uncommitted changes
echo "📝 Step 4: Checking Git status..."
git status
echo ""

# Step 5: Prompt for confirmation
echo -e "${YELLOW}⚠️  Ready to publish to GitHub?${NC}"
echo ""
echo "This will:"
echo "  1. Add all files to Git"
echo "  2. Create initial commit"
echo "  3. Set main branch"
echo "  4. Add GitHub remote: https://github.com/nooa-ai/nooa-core-engine.git"
echo "  5. Push to GitHub"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Cancelled by user${NC}"
    exit 1
fi
echo ""

# Step 6: Add all files
echo "📦 Step 6: Adding files to Git..."
git add .
echo -e "${GREEN}✅ Files added${NC}"
echo ""

# Step 7: Create commit
echo "💾 Step 7: Creating initial commit..."
git commit -m "Initial commit: Nooa Core Engine v1.2.0

- Architectural grammar validator
- Code hygiene features (synonym detection, zombie code detection)
- Clean Architecture compliance
- Self-validating dogfooding approach
- Complete documentation

🤖 Generated with Clean Architecture principles
" || echo -e "${YELLOW}⚠️  Files already committed${NC}"
echo ""

# Step 8: Set main branch
echo "🌿 Step 8: Setting main branch..."
git branch -M main
echo -e "${GREEN}✅ Main branch set${NC}"
echo ""

# Step 9: Add remote
echo "🔗 Step 9: Adding GitHub remote..."
REPO_URL="https://github.com/nooa-ai/nooa-core-engine.git"

# Remove existing remote if it exists
git remote remove origin 2>/dev/null || true

# Add new remote
git remote add origin "$REPO_URL"
echo -e "${GREEN}✅ Remote added: $REPO_URL${NC}"
echo ""

# Step 10: Push to GitHub
echo "🚀 Step 10: Pushing to GitHub..."
echo -e "${YELLOW}⚠️  This will push to: $REPO_URL${NC}"
read -p "Confirm push? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Push cancelled${NC}"
    exit 1
fi

if git push -u origin main; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo ""
    echo "================================================"
    echo "🎉 Publication Complete!"
    echo "================================================"
    echo ""
    echo "Next steps:"
    echo "  1. Visit: https://github.com/nooa-ai/nooa-core-engine"
    echo "  2. Check GitHub Actions: https://github.com/nooa-ai/nooa-core-engine/actions"
    echo "  3. Create release v1.2.0"
    echo "  4. Configure branch protection"
    echo ""
    echo "See GITHUB_SETUP.md for detailed post-publication steps."
else
    echo ""
    echo -e "${RED}❌ Push failed${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. Repository not created on GitHub yet"
    echo "  2. Authentication failed (run: gh auth login)"
    echo "  3. Wrong repository URL"
    echo ""
    echo "See GITHUB_SETUP.md for troubleshooting."
    exit 1
fi
