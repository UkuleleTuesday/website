#!/usr/bin/env python3
"""
Static export script for Ukulele Tuesday website
"""

import os
import sys
import time
import json
import base64
import logging
import requests
from typing import Dict, Any, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)

class StaticExporter:
    def __init__(self):
        self.base_url = "https://ukuleletuesday.ie/wp-json/simplystatic/v1"
        self.username = os.getenv('WP_USERNAME')
        self.password = os.getenv('WP_PASSWORD')
        
        if not self.username:
            logger.error("Error: WP_USERNAME environment variable is required")
            sys.exit(1)
            
        if not self.password:
            logger.error("Error: WP_PASSWORD environment variable is required")
            sys.exit(1)
        
        # Create auth header
        auth_string = f"{self.username}:{self.password}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        self.headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/json'
        }
        
        logger.info("Starting Simply Static export process...")
        logger.info(f"Using BASE_URL: {self.base_url}")
        logger.info(f"Using WP_USERNAME: {self.username}")

    def api_call(self, method: str, endpoint: str) -> Tuple[Dict[Any, Any], int]:
        """Make authenticated API calls to the Simply Static API"""
        url = f"{self.base_url}{endpoint}"
        
        logger.info(f"DEBUG: Inside api_call function")
        logger.info(f"DEBUG: method={method}, endpoint={endpoint}")
        logger.info(f"Making {method} request to {endpoint}...")
        logger.info(f"Full URL: {url}")
        
        try:
            logger.info("DEBUG: About to run requests call")
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                timeout=30
            )
            logger.info(f"DEBUG: requests finished with status code {response.status_code}")
            
            logger.info(f"Raw response: {response.text}")
            logger.info(f"Status code: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Error: API call to {endpoint} failed with status {response.status_code}")
                logger.error(f"Response: {response.text}")
                sys.exit(1)
            
            logger.info("DEBUG: About to return response")
            
            # Parse JSON response
            try:
                data = response.json()
                logger.info(f"DEBUG: Successfully parsed JSON: {data}")
                logger.info(f"DEBUG: Returning tuple: ({data}, {response.status_code})")
                return data, response.status_code
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {response.text}")
                logger.error(f"JSON decode error: {e}")
                sys.exit(1)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error: Request failed: {e}")
            sys.exit(1)

    def check_system_status(self) -> bool:
        """Check if the system is ready for export"""
        logger.info("Checking system status...")
        logger.info("DEBUG: About to call api_call")
        
        status_response, status_code = self.api_call("GET", "/system-status/passed")
        
        logger.info("DEBUG: api_call returned successfully")
        logger.info(f"DEBUG: status_response={status_response}")
        logger.info(f"DEBUG: status_response type={type(status_response)}")
        
        # Parse the response to check if system checks passed
        passed_status = status_response.get('passed')
        
        if passed_status == 'yes':
            logger.info("✓ System status checks passed")
            return True
        else:
            logger.error("✗ System status checks failed")
            logger.error(f"Response: {status_response}")
            logger.error(f"Parsed status: {passed_status}")
            return False

    def start_export(self) -> bool:
        """Start the static site export process"""
        logger.info("Starting static site export...")
        
        export_response, status_code = self.api_call("POST", "/start-export")
        
        logger.info(f"DEBUG: export_response={export_response}")
        
        # Parse the export start response
        export_status = export_response.get('status')
        export_message = export_response.get('message')
        
        if export_status:
            logger.info(f"Export status: {export_status}")
        
        if export_message:
            logger.info(f"Export message: {export_message}")
        
        logger.info("✓ Static site export has been started")
        return True

    def monitor_export_progress(self) -> Optional[str]:
        """Monitor the export process and return download URL when available"""
        logger.info("Monitoring export progress...")
        
        download_url = ""
        max_polling_time = 1800  # 30 minutes
        polling_interval = 10    # 10 seconds
        elapsed_time = 0
        last_message = ""
        
        while elapsed_time < max_polling_time:
            logger.info(f"Checking export status... (elapsed: {elapsed_time}s)")
            
            try:
                activity_response, status_code = self.api_call("GET", "/activity-log")
            except SystemExit:
                logger.warning(f"Warning: Failed to get activity log, retrying in {polling_interval}s...")
                time.sleep(polling_interval)
                elapsed_time += polling_interval
                continue
            
            logger.info(f"DEBUG: activity_response={activity_response}")
            
            # Check if export is still running
            is_running = activity_response.get('running', False)
            logger.info(f"Export running: {is_running}")
            
            # Check the data structure - it might be an array or object
            data = activity_response.get('data', {})
            data_type = type(data).__name__
            logger.info(f"DEBUG: data type is: {data_type}")
            
            current_message = ""
            
            if isinstance(data, dict):
                # Handle object format (expected format)
                setup_data = data.get('setup', {})
                fetch_data = data.get('fetch_urls', {})
                create_zip_data = data.get('create_zip_archive', {})
                wrapup_data = data.get('wrapup', {})
                done_data = data.get('done', {})
                
                setup_msg = setup_data.get('message', '') if setup_data else ''
                fetch_msg = fetch_data.get('message', '') if fetch_data else ''
                create_zip_msg = create_zip_data.get('message', '') if create_zip_data else ''
                wrapup_msg = wrapup_data.get('message', '') if wrapup_data else ''
                done_msg = done_data.get('message', '') if done_data else ''
                
                # Display current progress
                if done_msg:
                    current_message = f"✓ {done_msg}"
                elif wrapup_msg:
                    current_message = f"⏳ {wrapup_msg}"
                elif create_zip_msg:
                    current_message = "📦 Creating ZIP archive..."
                    # Extract download URL from the message
                    import re
                    url_match = re.search(r'https://[^"]*\.zip', create_zip_msg)
                    if url_match:
                        download_url = url_match.group(0)
                        logger.info("✓ ZIP archive created successfully!")
                        logger.info(f"Download URL found: {download_url}")
                elif fetch_msg:
                    current_message = f"📄 {fetch_msg}"
                elif setup_msg:
                    current_message = f"🔧 {setup_msg}"
                    
            elif isinstance(data, list):
                # Handle array format - just show that export is in progress
                if is_running:
                    current_message = "⏳ Export in progress... (waiting for activity data)"
            else:
                # Unknown data format
                logger.info(f"DEBUG: Unknown data format: {data_type}")
                if is_running:
                    current_message = "⏳ Export in progress..."
            
            # Only print if message changed
            if current_message != last_message and current_message:
                logger.info(current_message)
                last_message = current_message
            
            # Check if export is complete
            if not is_running:
                logger.info("✓ Export process has completed!")
                
                # Try to get the final status
                logger.info("Checking final export status...")
                
                # If we don't have a download URL yet, try to get it from the final activity log
                if not download_url and isinstance(data, dict):
                    create_zip_data = data.get('create_zip_archive', {})
                    if create_zip_data:
                        create_zip_msg = create_zip_data.get('message', '')
                        if create_zip_msg:
                            import re
                            url_match = re.search(r'https://[^"]*\.zip', create_zip_msg)
                            if url_match:
                                download_url = url_match.group(0)
                
                break
            
            time.sleep(polling_interval)
            elapsed_time += polling_interval
        
        # Check if we timed out
        if elapsed_time >= max_polling_time:
            logger.error(f"✗ Export process timed out after {max_polling_time} seconds")
            return None
        
        return download_url

    def run(self) -> bool:
        """Run the complete export process"""
        # Step 1: Check system status
        if not self.check_system_status():
            return False
        
        # Step 2: Start the export process
        if not self.start_export():
            return False
        
        # Step 3: Monitor the export process
        download_url = self.monitor_export_progress()
        
        if download_url is None:
            return False
        
        # If we still don't have a download URL, that's not necessarily a failure
        # The export might be configured differently (e.g., direct deployment)
        if not download_url:
            logger.warning("⚠ Export completed but no download URL was found")
            logger.warning("This might be normal if the site is configured for direct deployment")
        else:
            logger.info("✓ Export process completed successfully!")
            logger.info(f"Download URL: {download_url}")
        
        logger.info("Script completed successfully!")
        return True

def main():
    """Main entry point"""
    exporter = StaticExporter()
    success = exporter.run()
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
