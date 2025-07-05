#!/bin/bash

# Static export script for Ukulele Tuesday website
set -e

# Check required environment variables
if [ -z "$USERNAME" ]; then
    echo "Error: USERNAME environment variable is required"
    exit 1
fi

if [ -z "$PASSWORD" ]; then
    echo "Error: PASSWORD environment variable is required"
    exit 1
fi

# Configuration
BASE_URL="https://ukuleletuesday.ie/wp-json/simplystatic/v1"
AUTH_HEADER="Authorization: Basic $(echo -n "$USERNAME:$PASSWORD" | base64)"

echo "Starting Simply Static export process..."

# Function to make authenticated API calls
api_call() {
    local method="$1"
    local endpoint="$2"
    local response
    
    response=$(curl -s -w "\n%{http_code}" \
        -X "$method" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        "$BASE_URL$endpoint")
    
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n 1)
    
    echo "Response body: $body"
    echo "Status code: $status_code"
    
    if [ "$status_code" != "200" ]; then
        echo "Error: API call to $endpoint failed with status $status_code"
        echo "Response: $body"
        exit 1
    fi
    
    echo "$body"
}

# Step 1: Check system status
echo "Checking system status..."
status_response=$(api_call "GET" "/system-status/passed")

# Parse the response to check if system checks passed
if echo "$status_response" | grep -q '"passed":"yes"'; then
    echo "✓ System status checks passed"
else
    echo "✗ System status checks failed"
    echo "Response: $status_response"
    exit 1
fi

echo "System is ready for export!"
