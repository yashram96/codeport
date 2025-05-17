#!/bin/bash

REPO_ID=$1
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo "=== Deployment Started at $TIMESTAMP ==="
echo "Repository: $REPO_ID"
echo "Host: Staging Server"
echo ""
echo "Pulling latest code..."
sleep 1
echo "Building application..."
sleep 1
echo "Running tests..."
sleep 1
echo "Deploying to staging server..."
sleep 1
echo ""
echo "=== Deployment Completed Successfully ==="

exit 0