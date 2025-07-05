#!/bin/bash

# Static export script for Ukulele Tuesday website
set -e

# Check required environment variables
if [ -z "$WP_USERNAME" ]; then
    echo "Error: WP_USERNAME environment variable is required"
    exit 1
fi

if [ -z "$WP_PASSWORD" ]; then
    echo "Error: WP_PASSWORD environment variable is required"
    exit 1
fi

# Configuration
BASE_URL="https://ukuleletuesday.ie/wp-json/simplystatic/v1"
AUTH_HEADER="Authorization: Basic $(echo -n "$WP_USERNAME:$WP_PASSWORD" | base64)"

echo "Starting Simply Static export process..."
echo "Using BASE_URL: $BASE_URL"
echo "Using WP_USERNAME: $WP_USERNAME"

# Function to make authenticated API calls
api_call() {
    local method="$1"
    local endpoint="$2"
    local response
    local curl_exit_code
    
    echo "DEBUG: Inside api_call function" >&2
    echo "DEBUG: method=$method, endpoint=$endpoint" >&2
    echo "Making $method request to $endpoint..." >&2
    echo "Full URL: $BASE_URL$endpoint" >&2
    
    echo "DEBUG: About to run curl command" >&2
    response=$(curl --max-time 30 --connect-timeout 10 -s -w "\n%{http_code}" \
        -X "$method" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        "$BASE_URL$endpoint" 2>&1)
    curl_exit_code=$?
    echo "DEBUG: curl finished with exit code $curl_exit_code" >&2
    
    if [ $curl_exit_code -ne 0 ]; then
        echo "Error: curl command failed with exit code $curl_exit_code" >&2
        echo "Response/Error: $response" >&2
        return 1
    fi
    
    echo "Raw response: $response" >&2
    
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n 1)
    
    echo "Response body: $body" >&2
    echo "Status code: $status_code" >&2
    
    if [ "$status_code" != "200" ]; then
        echo "Error: API call to $endpoint failed with status $status_code" >&2
        echo "Response: $body" >&2
        return 1
    fi
    
    echo "DEBUG: About to return body" >&2
    echo "$body"
}

# Function to parse JSON safely
parse_json() {
    local json_string="$1"
    local key_path="$2"
    
    if command -v jq >/dev/null 2>&1; then
        # First try to parse as-is, if that fails, try unescaping the JSON string
        echo "$json_string" | jq -r "$key_path" 2>/dev/null || echo "$json_string" | jq -r ". | fromjson | $key_path" 2>/dev/null
    else
        echo "null"
    fi
}

# Step 1: Check system status
echo "Checking system status..."
echo "DEBUG: About to call api_call"

# Call api_call and handle errors
status_response=$(api_call "GET" "/system-status/passed")
api_call_exit_code=$?

echo "DEBUG: api_call returned with exit code $api_call_exit_code"

if [ $api_call_exit_code -ne 0 ]; then
    echo "Error: API call failed"
    exit 1
fi

echo "DEBUG: status_response=$status_response"

# Parse the response to check if system checks passed
passed_status=$(parse_json "$status_response" ".passed")

if [ "$passed_status" = "yes" ]; then
    echo "✓ System status checks passed"
else
    if command -v jq >/dev/null 2>&1; then
        echo "✗ System status checks failed"
        echo "Response: $status_response"
        echo "Parsed status: $passed_status"
        exit 1
    else
        # Fallback to grep - look for "passed":"yes" (with quotes around yes)
        if echo "$status_response" | grep -q '"passed":"yes"'; then
            echo "✓ System status checks passed"
        else
            echo "✗ System status checks failed"
            echo "Response: $status_response"
            exit 1
        fi
    fi
fi

# Step 2: Start the export process
echo "Starting static site export..."

export_response=$(api_call "POST" "/start-export")
export_call_exit_code=$?

if [ $export_call_exit_code -ne 0 ]; then
    echo "Error: Failed to start export"
    exit 1
fi

echo "DEBUG: export_response=$export_response"

# Parse the export start response
export_status=$(parse_json "$export_response" ".status")
export_message=$(parse_json "$export_response" ".message")

if [ "$export_status" != "null" ] && [ "$export_status" != "" ]; then
    echo "Export status: $export_status"
fi

if [ "$export_message" != "null" ] && [ "$export_message" != "" ]; then
    echo "Export message: $export_message"
fi

echo "✓ Static site export has been started"

# Step 3: Monitor the export process using activity-log
echo "Monitoring export progress..."

DOWNLOAD_URL=""
MAX_POLLING_TIME=1800  # 30 minutes
POLLING_INTERVAL=10    # 10 seconds
ELAPSED_TIME=0
LAST_MESSAGE=""

while [ $ELAPSED_TIME -lt $MAX_POLLING_TIME ]; do
    echo "Checking export status... (elapsed: ${ELAPSED_TIME}s)"
    
    activity_response=$(api_call "GET" "/activity-log")
    if [ $? -ne 0 ]; then
        echo "Warning: Failed to get activity log, retrying in ${POLLING_INTERVAL}s..."
        sleep $POLLING_INTERVAL
        ELAPSED_TIME=$((ELAPSED_TIME + POLLING_INTERVAL))
        continue
    fi
    
    echo "DEBUG: activity_response=$activity_response"
    
    # Check if export is still running
    is_running=$(parse_json "$activity_response" ".running")
    echo "Export running: $is_running"
    
    # Get the current status messages
    setup_msg=$(parse_json "$activity_response" ".data.setup.message")
    fetch_msg=$(parse_json "$activity_response" ".data.fetch_urls.message")
    create_zip_msg=$(parse_json "$activity_response" ".data.create_zip_archive.message")
    wrapup_msg=$(parse_json "$activity_response" ".data.wrapup.message")
    done_msg=$(parse_json "$activity_response" ".data.done.message")
    
    # Display current progress
    current_message=""
    if [ "$done_msg" != "null" ] && [ "$done_msg" != "" ]; then
        current_message="✓ $done_msg"
    elif [ "$wrapup_msg" != "null" ] && [ "$wrapup_msg" != "" ]; then
        current_message="⏳ $wrapup_msg"
    elif [ "$create_zip_msg" != "null" ] && [ "$create_zip_msg" != "" ]; then
        current_message="📦 Creating ZIP archive..."
    elif [ "$fetch_msg" != "null" ] && [ "$fetch_msg" != "" ]; then
        current_message="📄 $fetch_msg"
    elif [ "$setup_msg" != "null" ] && [ "$setup_msg" != "" ]; then
        current_message="🔧 $setup_msg"
    fi
    
    # Only print if message changed
    if [ "$current_message" != "$LAST_MESSAGE" ] && [ "$current_message" != "" ]; then
        echo "$current_message"
        LAST_MESSAGE="$current_message"
    fi
    
    # Check for download URL in the create_zip_archive message
    if [ "$create_zip_msg" != "null" ] && [ "$create_zip_msg" != "" ]; then
        # Extract download URL from the message using grep and sed
        DOWNLOAD_URL=$(echo "$create_zip_msg" | grep -o 'https://[^"]*\.zip' || echo "")
        if [ -n "$DOWNLOAD_URL" ]; then
            echo "✓ ZIP archive created successfully!"
            echo "Download URL found: $DOWNLOAD_URL"
        fi
    fi
    
    # Check if export is complete
    if [ "$is_running" = "false" ]; then
        if [ "$done_msg" != "null" ] && [ "$done_msg" != "" ]; then
            echo "✓ Export completed successfully!"
            echo "Final message: $done_msg"
            break
        else
            echo "✗ Export stopped but no completion message found"
            echo "Activity response: $activity_response"
            exit 1
        fi
    fi
    
    sleep $POLLING_INTERVAL
    ELAPSED_TIME=$((ELAPSED_TIME + POLLING_INTERVAL))
done

# Check if we timed out
if [ $ELAPSED_TIME -ge $MAX_POLLING_TIME ]; then
    echo "✗ Export process timed out after ${MAX_POLLING_TIME} seconds"
    exit 1
fi

# Verify we have a download URL
if [ -z "$DOWNLOAD_URL" ]; then
    echo "✗ Export completed but no download URL was found"
    exit 1
fi

echo "✓ Export process completed successfully!"
echo "Download URL: $DOWNLOAD_URL"
echo "Script completed successfully!"
