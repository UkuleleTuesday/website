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
import json
import tempfile
import zipfile
import shutil
import click
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)

class StaticExporter:
    def __init__(
            self,
            base_url: str,
            username: str,
            password: str,
            stop_export_timeout_seconds: int = 60,
            stop_export_poll_interval_seconds: int = 5,
            export_start_timeout_seconds: int = 120,
            export_start_poll_interval_seconds: int = 10,
            export_monitor_timeout_seconds: int = 150,
            export_monitor_poll_interval_seconds: int = 10,
            zip_download_timeout_seconds: int = 300
    ):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.stop_export_timeout_seconds = stop_export_timeout_seconds
        self.stop_export_poll_interval_seconds = stop_export_poll_interval_seconds
        self.export_start_timeout_seconds = export_start_timeout_seconds
        self.export_start_poll_interval_seconds = export_start_poll_interval_seconds
        self.export_monitor_timeout_seconds = export_monitor_timeout_seconds
        self.export_monitor_poll_interval_seconds = export_monitor_poll_interval_seconds
        self.zip_download_timeout_seconds = zip_download_timeout_seconds

        if not self.username:
            logger.error("Error: Username is required")
            sys.exit(1)

        if not self.password:
            logger.error("Error: Password is required")
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

        logger.info(f"Making {method} request to {endpoint}...")

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                timeout=30
            )

            if response.status_code != 200:
                logger.error(f"Error: API call to {endpoint} failed with status {response.status_code}")
                logger.error(f"Response: {response.text}")
                sys.exit(1)

            # Parse JSON response
            try:
                data = response.json()
                # Don't ask questions, this is a PHP API, REST APIs are a
                # little bit new, soon PHP devs will discover how to use them
                # properly, it's only 2025. Anyway, let's parse the json
                # response that is actually returned as a string, as json.
                actual_data = json.loads(data)
                return actual_data, response.status_code
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {response.text}")
                logger.error(f"JSON decode error: {e}")
                sys.exit(1)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error: Request failed: {e}")
            sys.exit(1)

    def check_if_export_running(self) -> bool:
        """Check if an export is currently running"""
        logger.info("Checking if export is already running...")

        api_result = self.api_call("GET", "/is-running")
        response_data = api_result[0]

        is_running = response_data.get('running', False)
        return is_running

    def cancel_running_export(self) -> bool:
        """Cancel any currently running export"""
        logger.info("Canceling running export...")

        api_result = self.api_call("POST", "/cancel-export")
        response_data = api_result[0]

        logger.info("✓ Export cancellation requested")
        return True

    def wait_for_export_to_stop(self) -> bool:
        """Wait for any running export to stop"""
        logger.info("Waiting for export to stop...")

        elapsed_time = 0

        while elapsed_time < self.stop_export_timeout_seconds:
            if not self.check_if_export_running():
                logger.info("✓ No export is currently running")
                return True

            logger.info(f"Export still running, waiting... (elapsed: {elapsed_time}s)")
            time.sleep(self.stop_export_poll_interval_seconds)
            elapsed_time += self.stop_export_poll_interval_seconds

        logger.error(f"✗ Timed out waiting for export to stop after {self.stop_export_timeout_seconds} seconds")
        self.cancel_running_export()
        return False

    def ensure_no_running_export(self) -> bool:
        """Ensure no export is running, cancel if necessary"""
        if self.check_if_export_running():
            logger.warning("⚠ An export is already running")
            self.cancel_running_export()
            return self.wait_for_export_to_stop()
        else:
            logger.info("✓ No export is currently running")
            return True

    def check_system_status(self) -> bool:
        """Check if the system is ready for export"""
        logger.info("Checking system status...")

        api_result = self.api_call("GET", "/system-status/passed")
        status_response = api_result[0]
        status_code = api_result[1]

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

        api_result = self.api_call("POST", "/start-export")
        export_response = api_result[0]
        status_code = api_result[1]

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

        # Retry loop to wait for export to start, because the API is... special
        start_elapsed = 0
        while start_elapsed < self.export_start_timeout_seconds:
            if self.check_if_export_running():
                logger.info("✓ Export process has started.")
                break
            logger.warning(f"Export not started yet, waiting {self.export_start_poll_interval_seconds}s...")
            time.sleep(self.export_start_poll_interval_seconds)
            start_elapsed += self.export_start_poll_interval_seconds
        else:
            logger.error(f"✗ Export did not start within {self.export_start_timeout_seconds} seconds.")
            self.cancel_running_export()
            return None

        download_url = ""
        elapsed_time = 0
        last_message = ""

        while elapsed_time < self.export_monitor_timeout_seconds:
            logger.info(f"Checking export status... (elapsed: {elapsed_time}s)")

            try:
                api_result = self.api_call("GET", "/activity-log")
                activity_response = api_result[0]
                status_code = api_result[1]
            except SystemExit:
                logger.warning(f"Warning: Failed to get activity log, retrying in {self.export_monitor_poll_interval_seconds}s...")
                time.sleep(self.export_monitor_poll_interval_seconds)
                elapsed_time += self.export_monitor_poll_interval_seconds
                continue

            # Check if export is still running
            is_running = activity_response.get('running', False)
            logger.info(f"Export running: {is_running}")

            # Check the data structure - it might be an array or object
            data = activity_response.get('data', {})
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
                if is_running:
                    current_message = "⏳ Export in progress..."

            # Only print if message changed
            if current_message != last_message and current_message:
                logger.info(current_message)
                last_message = current_message
                # Reset elapsed time since we have activity
                elapsed_time = 0

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

            time.sleep(self.export_monitor_poll_interval_seconds)
            elapsed_time += self.export_monitor_poll_interval_seconds

        # Check if we timed out
        if elapsed_time >= self.export_monitor_timeout_seconds:
            logger.error(f"✗ Export process timed out after {self.export_monitor_timeout_seconds} seconds")
            self.cancel_running_export()
            return None

        return download_url

    def download_and_extract_zip(self, download_url: str, output_dir: str) -> bool:
        """Download the ZIP file and extract it to the specified directory"""
        logger.info("Downloading static site archive...")

        try:
            # Create a temporary directory for the download
            temp_dir = tempfile.mkdtemp(prefix='ukulele_tuesday_download_')
            logger.info(f"Created temporary directory: {temp_dir}")

            # Download the ZIP file
            response = requests.get(download_url, timeout=self.zip_download_timeout_seconds)
            response.raise_for_status()

            # Save to a temporary ZIP file
            zip_path = os.path.join(temp_dir, 'static_site.zip')
            with open(zip_path, 'wb') as f:
                f.write(response.content)

            logger.info(f"✓ Downloaded ZIP file ({len(response.content)} bytes)")

            # Ensure output directory exists
            os.makedirs(output_dir, exist_ok=True)

            # Extract the ZIP file directly to the output directory
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(output_dir)

            # Count extracted files
            extracted_files = list(Path(output_dir).rglob('*'))
            file_count = len([f for f in extracted_files if f.is_file()])

            logger.info(f"✓ Extracted {file_count} files to {output_dir}")

            # Clean up the temporary directory
            shutil.rmtree(temp_dir)

            return True

        except requests.exceptions.RequestException as e:
            logger.error(f"✗ Failed to download ZIP file: {e}")
            return False
        except zipfile.BadZipFile as e:
            logger.error(f"✗ Failed to extract ZIP file: {e}")
            return False
        except Exception as e:
            logger.error(f"✗ Unexpected error during download/extraction: {e}")
            return False

    def run_download(self, output_dir: str) -> bool:
        """Run the complete export and download process"""
        # Ensure output directory exists
        try:
            os.makedirs(output_dir, exist_ok=True)
            logger.info(f"✓ Output directory ready: {output_dir}")
        except OSError as e:
            logger.error(f"✗ Failed to create output directory: {e}")
            return False

        # Step 0: Ensure no export is currently running
        if not self.ensure_no_running_export():
            return False

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

        # Step 4: Download and extract the static site
        if download_url:
            success = self.download_and_extract_zip(download_url, output_dir)
            if success:
                logger.info("✓ Export and download process completed successfully!")
                logger.info(f"Static site extracted to: {output_dir}")
                return True
            else:
                logger.error("✗ Failed to download and extract static site")
                return False
        else:
            logger.warning("⚠ Export completed but no download URL was found")
            logger.warning("This might be normal if the site is configured for direct deployment")
            return False


@click.group()
def cli():
    """Ukulele Tuesday static site export tool"""
    pass


@cli.command()
@click.option('-o', '--output', 'output_dir', required=True,
              help='Output directory for the extracted static site')
@click.option('--num-retries', 'num_retries', default=0, type=int,
              help='Number of times to retry the export on failure')
def download(output_dir: str, num_retries: int):
    """Export the WordPress site and download the static files"""
    exporter = StaticExporter(
        base_url="https://ukuleletuesday.ie/wp-json/simplystatic/v1",
        username=os.getenv('WP_USERNAME'),
        password=os.getenv('WP_PASSWORD')
    )

    success = False
    for i in range(num_retries + 1):
        attempt = i + 1
        logger.info(f"--- Starting export attempt {attempt}/{num_retries + 1} ---")
        success = exporter.run_download(output_dir)

        if success:
            break

        if i < num_retries:
            retry_wait_seconds = 10
            logger.warning(f"Attempt {attempt} failed. Retrying in {retry_wait_seconds} seconds...")
            time.sleep(retry_wait_seconds)

    if not success:
        logger.error("✗ All export attempts failed.")
        sys.exit(1)


if __name__ == "__main__":
    cli()
