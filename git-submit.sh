#!/bin/bash

# Git Submit Script with Automatic Change Summary
# Usage: ./git-submit.sh [optional custom message]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Analyzing git repository status...${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check if there are any changes to commit
if git diff --cached --quiet && git diff --quiet; then
    echo -e "${YELLOW}⚠️  No changes detected. Nothing to commit.${NC}"
    exit 0
fi

# Stage all changes if nothing is staged but there are unstaged changes
if git diff --cached --quiet && ! git diff --quiet; then
    echo -e "${YELLOW}📝 Staging all changes...${NC}"
    git add .
fi

# Check again if there are staged changes
if git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  No staged changes to commit.${NC}"
    exit 0
fi

echo -e "${GREEN}📊 Changes to be committed:${NC}"
git diff --cached --stat

echo -e "\n${BLUE}📝 Generating commit message...${NC}"

# Function to generate commit message based on changes
generate_commit_message() {
    local commit_msg=""
    local files_changed=$(git diff --cached --name-only | wc -l | tr -d ' ')
    local additions=$(git diff --cached --numstat | awk '{add += $1} END {print add+0}')
    local deletions=$(git diff --cached --numstat | awk '{del += $2} END {print del+0}')
    
    # Analyze types of changes
    local new_files=$(git diff --cached --name-status | grep -c "^A" 2>/dev/null || echo 0)
    local modified_files=$(git diff --cached --name-status | grep -c "^M" 2>/dev/null || echo 0)
    local deleted_files=$(git diff --cached --name-status | grep -c "^D" 2>/dev/null || echo 0)
    local renamed_files=$(git diff --cached --name-status | grep -c "^R" 2>/dev/null || echo 0)
    
    # Get file extensions to understand what type of changes
    local file_types=$(git diff --cached --name-only | sed 's/.*\.//' | sort | uniq -c | sort -nr | head -3)
    
    # Generate appropriate commit message prefix
    if [[ $new_files -gt 0 && $modified_files -eq 0 && $deleted_files -eq 0 ]]; then
        commit_msg="feat: add"
    elif [[ $deleted_files -gt 0 && $new_files -eq 0 && $modified_files -eq 0 ]]; then
        commit_msg="remove:"
    elif [[ $modified_files -gt 0 && $new_files -eq 0 && $deleted_files -eq 0 ]]; then
        commit_msg="update:"
    elif [[ $renamed_files -gt 0 ]]; then
        commit_msg="refactor:"
    else
        commit_msg="chore:"
    fi
    
    # Add file count information
    if [[ $files_changed -eq 1 ]]; then
        local filename=$(git diff --cached --name-only)
        commit_msg="$commit_msg $(basename "$filename")"
    else
        commit_msg="$commit_msg $files_changed files"
    fi
    
    # Add change statistics
    local change_summary=""
    if [[ $additions -gt 0 && $deletions -gt 0 ]]; then
        change_summary=" (+$additions/-$deletions lines)"
    elif [[ $additions -gt 0 ]]; then
        change_summary=" (+$additions lines)"
    elif [[ $deletions -gt 0 ]]; then
        change_summary=" (-$deletions lines)"
    fi
    
    commit_msg="$commit_msg$change_summary"
    
    # Add file type context if helpful
    if echo "$file_types" | grep -q "py\|js\|ts\|go\|java\|cpp\|c\|rs"; then
        commit_msg="$commit_msg"
    elif echo "$file_types" | grep -q "md\|txt\|rst"; then
        commit_msg="$commit_msg [docs]"
    elif echo "$file_types" | grep -q "json\|yaml\|yml\|toml"; then
        commit_msg="$commit_msg [config]"
    fi
    
    echo "$commit_msg"
}

# Use custom message if provided, otherwise generate one
if [[ $# -gt 0 ]]; then
    COMMIT_MESSAGE="$*"
    echo -e "${GREEN}📝 Using custom message: ${COMMIT_MESSAGE}${NC}"
else
    COMMIT_MESSAGE=$(generate_commit_message)
    echo -e "${GREEN}📝 Generated message: ${COMMIT_MESSAGE}${NC}"
fi

echo -e "\n${YELLOW}🔍 Preview of changes:${NC}"
git diff --cached --stat
echo

# Confirm before committing
echo -e "${BLUE}❓ Commit with message: '${COMMIT_MESSAGE}'? [Y/n]${NC}"
read -r confirmation
confirmation=${confirmation:-Y}

if [[ $confirmation =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}📦 Committing changes...${NC}"
    git commit -m "$COMMIT_MESSAGE"
    
    echo -e "${GREEN}✅ Successfully committed!${NC}"
    
    # Ask if user wants to push
    echo -e "${BLUE}❓ Push to remote repository? [Y/n]${NC}"
    read -r push_confirmation
    push_confirmation=${push_confirmation:-Y}
    
    if [[ $push_confirmation =~ ^[Yy]$ ]]; then
        current_branch=$(git branch --show-current)
        echo -e "${GREEN}🚀 Pushing to origin/${current_branch}...${NC}"
        
        if git push origin "$current_branch"; then
            echo -e "${GREEN}✅ Successfully pushed to remote!${NC}"
        else
            echo -e "${RED}❌ Failed to push. You may need to pull first or check your remote configuration.${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}📝 Changes committed locally. Don't forget to push when ready!${NC}"
    fi
else
    echo -e "${YELLOW}❌ Commit cancelled.${NC}"
    exit 0
fi

echo -e "\n${GREEN}🎉 Git operation completed successfully!${NC}"
