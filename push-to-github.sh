#!/bin/bash

# Push Voice Chat App to GitHub
# This script automates the GitHub push process

set -e  # Exit on any error

echo "=========================================="
echo "Pushing Voice Chat App to GitHub"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${NC}→ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Git repository details
GITHUB_REPO="https://github.com/dhruvbhavsar0612/broccoli-ai.git"
GITHUB_USERNAME="dhruvbhavsar0612"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_warning "Not in the voice-chat-app directory. Changing directory..."
    cd "$(dirname "$0")"
fi

print_info "Checking Git status..."

# Initialize git if needed
if [ ! -d ".git" ]; then
    print_info "Initializing Git repository..."
    git init
    print_success "Git initialized"
fi

# Configure git user if not set
if [ -z "$(git config user.email)" ]; then
    print_info "Configuring Git user..."
    git config user.email "dhruvbhavsar0612@users.noreply.github.com"
    git config user.name "dhruvbhavsar0612"
    print_success "Git user configured"
fi

# Check if remote exists
if git remote | grep -q "origin"; then
    print_warning "Remote 'origin' already exists"
    CURRENT_REMOTE=$(git remote get-url origin)
    print_info "Current remote: $CURRENT_REMOTE"

    if [ "$CURRENT_REMOTE" != "$GITHUB_REPO" ]; then
        print_info "Updating remote URL..."
        git remote set-url origin "$GITHUB_REPO"
    fi
else
    print_info "Adding remote 'origin'..."
    git remote add origin "$GITHUB_REPO"
    print_success "Remote added"
fi

# Add all files
print_info "Staging files..."
git add .

# Check if there are changes to commit
if git diff-index --quiet HEAD 2>/dev/null; then
    print_warning "No changes to commit"
else
    # Commit changes
    print_info "Committing changes..."
    COMMIT_MSG="Deploy: Voice Chat App - $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG" || print_warning "Commit failed or no changes"
    print_success "Changes committed"
fi

# Get current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")

# Ensure we're on main branch
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_info "Switching to main branch..."
    git checkout -b main 2>/dev/null || git checkout main
fi

# Push to GitHub
print_info "Pushing to GitHub..."
echo ""
print_warning "You may be prompted for your GitHub credentials"
print_info "Use your GitHub username and Personal Access Token (not password)"

# Push to GitHub
git push -u origin main

print_success "Successfully pushed to GitHub!"
echo ""
print_info "Repository URL: https://github.com/dhruvbhavsar0612/broccoli-ai"
print_info "Branch: main"
echo ""
print_success "Next steps:"
echo "  1. Verify the push at: https://github.com/dhruvbhavsar0612/broccoli-ai"
echo "  2. Connect to your EC2 server"
echo "  3. Run the deployment script"
echo ""
print_info "To connect to EC2:"
echo "  ssh -i teleai-ssh.pem ubuntu@ec2-13-204-192-32.ap-south-1.compute.amazonaws.com"
echo ""
print_success "Done! 🚀"
