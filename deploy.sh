#!/bin/bash
# Deployment Script for build-a-web-app
# This script uploads all files from the current git repository to the server.
# It only overwrites matching files, leaving other files on the server untouched.

# Function to print green success messages
print_success() {
    printf "\033[0;32m✓ %s\033[0m\n" "$1"
}

# Function to print red error messages
print_error() {
    printf "\033[0;31m✗ %s\033[0m\n" "$1"
}

# Function to print yellow warning messages
print_warning() {
    printf "\033[0;33m⚠ %s\033[0m\n" "$1"
}

# User-configurable variables
SSH_HOST="hyperclay"  # SSH host from your config
REMOTE_DIR="/var/www/journeyship"
APP_NAME="journeyship"

# Function to display usage information
usage() {
    echo "Usage: $0 [-h SSH_HOST] [-d REMOTE_DIR]"
    echo "  -h SSH_HOST     Specify the SSH host name (default: hyperclay)"
    echo "  -d REMOTE_DIR   Specify the remote directory (default: /var/www/build-a-web-app)"
    exit 1
}

# Parse command-line options
while getopts ":h:d:" opt; do
    case $opt in
        h) SSH_HOST="$OPTARG" ;;
        d) REMOTE_DIR="$OPTARG" ;;
        \?) echo "Invalid option: -$OPTARG" >&2; usage ;;
        :) echo "Option -$OPTARG requires an argument." >&2; usage ;;
    esac
done

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    print_error "Error: Not in a git repository. Please run this script from within a git repo."
    exit 1
fi

# Get the root directory of the git repository
REPO_ROOT=$(git rev-parse --show-toplevel)

# Change to the root directory of the git repository
cd "$REPO_ROOT" || exit 1
print_success "Changed to git repository root directory"

# Capture deployment information
COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_SHORT=$(git rev-parse --short HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=format:'%s')
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Create deployment log file with just the commit hash
DEPLOY_LOG_FILE=".last-deployed"
echo "$COMMIT_HASH" > "$DEPLOY_LOG_FILE"
print_success "Created deployment tracking file"

# Display what's being deployed
echo ""
echo "========================================="
echo "Deploying commit: $COMMIT_SHORT"
echo "Branch: $BRANCH"
echo "Message: $COMMIT_MESSAGE"
echo "========================================="
echo ""

# Create a temporary directory for the files to be uploaded
TEMP_DIR=$(mktemp -d)
print_success "Created temporary directory for file preparation"

# Copy all tracked files to the temporary directory
git ls-files | while IFS= read -r file; do
    mkdir -p "$(dirname "$TEMP_DIR/$file")"
    cp "$file" "$TEMP_DIR/$file"
done

# Also copy the deployment tracking file
cp "$DEPLOY_LOG_FILE" "$TEMP_DIR/$DEPLOY_LOG_FILE"
print_success "Copied all tracked files and deployment log to temporary directory"

# Use rsync to upload files (additive, won't delete if untracked)
rsync -avz \
    -e "ssh" \
    --exclude='.git' \
    --exclude='node_modules' \
    "$TEMP_DIR"/ \
    "$SSH_HOST":"$REMOTE_DIR"
print_success "Files uploaded to $SSH_HOST:$REMOTE_DIR"

# Clean up the temporary directory
rm -rf "$TEMP_DIR"
print_success "Cleaned up temporary directory"

# Run npm install and restart the application using PM2
ssh "$SSH_HOST" bash << EOF
print_success() {
    printf "\033[0;32m✓ %s\033[0m\n" "\$1"
}

cd "$REMOTE_DIR"

# Install dependencies
npm install --production
print_success "npm install completed on remote server"

# Ensure data directory exists with correct permissions
sudo mkdir -p data
sudo chown -R www-data:www-data data
sudo chmod 755 data
print_success "Data directory permissions set"

# Fix app directory and public directory permissions
sudo chmod 755 "$REMOTE_DIR"
sudo chmod -R 755 "$REMOTE_DIR/public"
print_success "App directory permissions set"

# Restart application with PM2
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save --force
print_success "Application restarted with PM2"

# Show status
pm2 status
EOF

print_success "Deployment complete!"
echo ""
echo "========================================="
echo "Deployed version: $COMMIT_SHORT ($BRANCH)"
echo "========================================="
echo ""
echo "Deployment tracking saved to:"
echo "  - Local: $DEPLOY_LOG_FILE (commit hash: $COMMIT_HASH)"
echo "  - Server: $SSH_HOST:$REMOTE_DIR/$DEPLOY_LOG_FILE"
echo ""
echo "Next steps:"
echo "  - Check logs: ssh $SSH_HOST 'pm2 logs $APP_NAME'"
echo "  - Check status: ssh $SSH_HOST 'pm2 status'"
echo "  - Check deployed version: ssh $SSH_HOST 'cat $REMOTE_DIR/$DEPLOY_LOG_FILE'"
echo "  - Visit: https://journeyship.storylog.com"
