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
echo "Using BASE_URL: $BASE_URL"
echo "Using USERNAME: $USERNAME"

# Function to make authenticated API calls
api_call() {
    local method="$1"
    local endpoint="$2"
    local response
    local curl_exit_code
    
    echo "DEBUG: Inside api_call function"
    echo "DEBUG: method=$method, endpoint=$endpoint"
    echo "Making $method request to $endpoint..."
    echo "Full URL: $BASE_URL$endpoint"
    
    echo "DEBUG: About to run curl command"
    set +e  # Temporarily disable exit on error
    response=$(curl --max-time 30 --connect-timeout 10 -s -w "\n%{http_code}" \
        -X "$method" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        "$BASE_URL$endpoint" 2>&1)
    curl_exit_code=$?
    echo "DEBUG: curl finished with exit code $curl_exit_code"
    set -e  # Re-enable exit on error
    
    if [ $curl_exit_code -ne 0 ]; then
        echo "Error: curl command failed with exit code $curl_exit_code"
        echo "Response/Error: $response"
        return 1
    fi
    
    echo "Raw response: $response"
    
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n 1)
    
    echo "Response body: $body"
    echo "Status code: $status_code"
    
    if [ "$status_code" != "200" ]; then
        echo "Error: API call to $endpoint failed with status $status_code"
        echo "Response: $body"
        return 1
    fi
    
    echo "DEBUG: About to return body"
    echo "$body"
}

# Step 1: Check system status
echo "Checking system status..."
echo "DEBUG: About to call api_call"

# Call api_call and handle errors
set +e
status_response=$(api_call "GET" "/system-status/passed")
api_call_exit_code=$?
set -e

echo "DEBUG: api_call returned with exit code $api_call_exit_code"

if [ $api_call_exit_code -ne 0 ]; then
    echo "Error: API call failed"
    exit 1
fi

echo "DEBUG: status_response=$status_response"

# Parse the response to check if system checks passed
if echo "$status_response" | grep -q '"passed":"yes"'; then
    echo "✓ System status checks passed"
else
    echo "✗ System status checks failed"
    echo "Response: $status_response"
    exit 1
fi

echo "System is ready for export!"
echo "Script completed successfully!"
