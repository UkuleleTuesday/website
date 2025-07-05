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

- `run-static-export.sh` - Main script that orchestrates the export process
  - Checks system status via Simply Static API
  - Triggers static site generation
  - Monitors export progress
  - Downloads generated files
  - Performs cleanup operations

### GitHub Actions

- Automated workflows that run the export script on a schedule
- Handles authentication and deployment to GitHub Pages
- Provides logging and error reporting

## Prerequisites

- WordPress site with Simply Static plugin installed and configured
- WordPress user account with appropriate permissions
- GitHub repository with Pages enabled

## Environment Variables

The following environment variables are required:

- `WP_USERNAME` - WordPress username with API access
- `WP_PASSWORD` - WordPress application password or user password

## API Endpoints

The script interacts with the Simply Static plugin via these endpoints:

- `/system-status/passed` - Check if system is ready for export
- `/start-export` - Initiate static site generation
- `/is-running` - Check export status
- `/cancel-export` - Cancel running export
- `/pause-export` - Pause export process
- `/resume-export` - Resume paused export

