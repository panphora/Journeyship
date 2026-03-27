#!/bin/bash
# Quick script to check deployment status

# Function to print green success messages
print_success() {
    printf "\033[0;32m✓ %s\033[0m\n" "$1"
}

# Function to print yellow warning messages
print_warning() {
    printf "\033[0;33m⚠ %s\033[0m\n" "$1"
}

# Function to print red error messages
print_error() {
    printf "\033[0;31m✗ %s\033[0m\n" "$1"
}

SSH_HOST="hyperclay"
REMOTE_DIR="/var/www/journeyship"

echo "========================================="
echo "Deployment Status Check"
echo "========================================="
echo ""

# Get current local commit
CURRENT_HASH=$(git rev-parse HEAD)
CURRENT_SHORT=$(git rev-parse --short HEAD)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CURRENT_MESSAGE=$(git log -1 --pretty=format:'%s')

echo "Local repository:"
echo "  Branch: $CURRENT_BRANCH"
echo "  Commit: $CURRENT_SHORT"
echo "  Message: $CURRENT_MESSAGE"
echo ""

# Check if local .last-deployed exists
if [ -f ".last-deployed" ]; then
    LAST_LOCAL_DEPLOYED=$(cat .last-deployed)
    LAST_LOCAL_SHORT=$(echo "$LAST_LOCAL_DEPLOYED" | cut -c1-7)
    echo "Last local deploy:"
    echo "  Commit: $LAST_LOCAL_SHORT"
    if [ "$LAST_LOCAL_DEPLOYED" = "$CURRENT_HASH" ]; then
        print_success "Local is up to date with last deployment"
    else
        COMMITS_AHEAD=$(git rev-list --count "$LAST_LOCAL_DEPLOYED".."$CURRENT_HASH" 2>/dev/null || echo "unknown")
        print_warning "Local is $COMMITS_AHEAD commits ahead of last deployment"
    fi
else
    print_warning "No local deployment record found (.last-deployed file missing)"
fi

echo ""

# Check remote deployment
echo "Checking remote server..."
REMOTE_HASH=$(ssh "$SSH_HOST" "cat $REMOTE_DIR/.last-deployed 2>/dev/null" || echo "")

if [ -n "$REMOTE_HASH" ]; then
    REMOTE_SHORT=$(echo "$REMOTE_HASH" | cut -c1-7)
    echo "Remote deployment:"
    echo "  Commit: $REMOTE_SHORT"

    if [ "$REMOTE_HASH" = "$CURRENT_HASH" ]; then
        print_success "Remote is up to date with current local commit"
    else
        # Check if remote commit exists in local repo
        if git rev-parse --quiet --verify "$REMOTE_HASH" > /dev/null 2>&1; then
            REMOTE_MESSAGE=$(git log -1 --pretty=format:'%s' "$REMOTE_HASH")
            echo "  Message: $REMOTE_MESSAGE"
            COMMITS_AHEAD=$(git rev-list --count "$REMOTE_HASH".."$CURRENT_HASH" 2>/dev/null || echo "unknown")
            if [ "$COMMITS_AHEAD" -gt 0 ]; then
                print_warning "Local is $COMMITS_AHEAD commits ahead of remote"
                echo ""
                echo "Commits not yet deployed:"
                git log --oneline "$REMOTE_HASH".."$CURRENT_HASH" | head -10
            elif [ "$COMMITS_AHEAD" -eq 0 ]; then
                print_warning "Remote has a different commit (possibly from another branch)"
            fi
        else
            print_error "Remote commit not found in local repository"
        fi
    fi
else
    print_error "No deployment record found on remote server"
fi

echo ""
echo "========================================="
echo "To deploy: ./deploy.sh"
echo "========================================="