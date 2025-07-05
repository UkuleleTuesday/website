# Ukulele Tuesday Static Site Export

This project automates the process of exporting the Ukulele Tuesday WordPress website to a static site and publishing it to GitHub Pages.

## Overview

The Ukulele Tuesday website (https://ukuleletuesday.ie) is a WordPress site that we want to convert to a static site for better performance, security, and cost-effectiveness. This repository contains scripts and GitHub Actions workflows to automate this process.

## How It Works

The export process consists of several steps:

1. **Export**: Uses the Simply Static WordPress plugin's REST API to generate a static version of the site
2. **Download**: Retrieves the generated static files from the WordPress server
3. **Clean**: Processes and optimizes the static files (removes WordPress-specific elements, optimizes assets, etc.)
4. **Publish**: Deploys the cleaned static files to GitHub Pages

## Components

### Scripts

- `export.py` - Main script that orchestrates the export process
  - Checks system status via Simply Static API
  - Triggers static site generation
  - Monitors export progress
  - Downloads generated files
  - Performs cleanup operations

### GitHub Actions

- `.github/workflows/export-static-site.yml` - Automated workflow that runs the export script on a schedule
- Handles authentication and deployment to GitHub Pages
- Provides logging and error reporting

## Prerequisites

- WordPress site with Simply Static plugin installed and configured
- WordPress user account with appropriate permissions
- GitHub repository with Pages enabled
- Python 3.12+ with uv package manager

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd ukulele-tuesday-static-website
   ```

2. Install uv (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

3. Install dependencies:
   ```bash
   uv sync
   ```

## Configuration

### WordPress Setup

1. Install and activate the Simply Static plugin on your WordPress site
2. Configure the plugin with your desired export settings
3. Create an application password for your WordPress user account
4. Ensure the user has sufficient permissions to access the Simply Static API

### GitHub Setup

1. Enable GitHub Pages in repository settings
2. Add the following secrets to your repository:
   - `WP_USERNAME` - WordPress username with API access
   - `WP_PASSWORD` - WordPress application password

### Local Environment

Set environment variables for local development:

```bash
export WP_USERNAME="your-username"
export WP_PASSWORD="your-app-password"
```

## Environment Variables

The following environment variables are required:

- `WP_USERNAME` - WordPress username with API access
- `WP_PASSWORD` - WordPress application password or user password

## Usage

### Manual Export

Download and extract the static site to a local directory:

```bash
uv run export.py download -o ./output-directory
```

### Available Commands

- `download` - Export the WordPress site and download the static files
  - `-o, --output` - Output directory for the extracted static site (required)

### Automated Deployment

The GitHub Actions workflow runs automatically:

- **Daily at 2 AM UTC** - Scheduled export
- **On push to main branch** - For testing changes
- **Manual trigger** - Via GitHub Actions interface

## API Endpoints

The script interacts with the Simply Static plugin via these endpoints:

- `/system-status/passed` - Check if system is ready for export
- `/start-export` - Initiate static site generation
- `/is-running` - Check export status
- `/cancel-export` - Cancel running export
- `/activity-log` - Get export progress information

## Project Structure

```
├── .github/
│   └── workflows/
│       └── export-static-site.yml    # GitHub Actions workflow
├── extra-assets/                     # Additional assets to include
│   └── wp-admin/
│       └── admin-ajax.css           # CSS replacement for dynamic requests
├── export.py                        # Main export script
├── pyproject.toml                   # Python project configuration
├── uv.lock                          # Dependency lock file
└── README.md                        # This documentation
```

## Workflow Process

The automated workflow performs these steps:

1. **Checkout** - Downloads repository code
2. **Setup Pages** - Configures GitHub Pages deployment
3. **Install uv** - Installs the uv package manager
4. **Run Export** - Executes the export script to download static files
5. **Fix Paths** - Corrects WordPress-specific URLs and paths
6. **Copy Assets** - Includes additional assets from `extra-assets/`
7. **Upload Artifact** - Prepares files for deployment
8. **Deploy** - Publishes to GitHub Pages

## Dependencies

- **click** - Command-line interface framework
- **requests** - HTTP library for API calls

## License

This project is open source.
