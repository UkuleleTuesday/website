#!/usr/bin/env python3
"""
Scrapy-based static site exporter for Ukulele Tuesday website.
"""

import logging
import os
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy.linkextractors import LinkExtractor
from scrapy.utils.project import get_project_settings

logger = logging.getLogger(__name__)


class StaticSiteSpider(scrapy.Spider):
    name = 'static_site_spider'

    def __init__(self, start_url, output_dir, *args, **kwargs):
        super(StaticSiteSpider, self).__init__(*args, **kwargs)
        self.start_urls = [start_url]
        self.allowed_domains = [urlparse(start_url).netloc]
        self.output_dir = Path(output_dir)
        self.link_extractor = LinkExtractor(allow_domains=self.allowed_domains)

    def parse(self, response):
        # Save the page itself
        yield from self.save_file(response)

        # Extract and follow links to other pages
        for link in self.link_extractor.extract_links(response):
            yield scrapy.Request(link.url, callback=self.parse)

        # Scrapy's link extractor might miss root links like href="/", let's get them manually.
        for href in response.css('a::attr(href)').getall():
            if href == "/" and response.url == self.start_urls[0]:
                yield scrapy.Request(response.urljoin(href), callback=self.parse)

        # Extract and download static assets (CSS, JS, images, etc.)
        for asset_url in self.extract_asset_urls(response):
            # Only request assets with http/https schemes
            if asset_url.startswith('http'):
                yield scrapy.Request(asset_url, callback=self.save_file)

    def extract_asset_urls(self, response):
        """Extracts all static asset URLs from a response."""
        urls = set()
        # Get all src, href, and srcset attributes
        for element in response.css('[src], [href], [srcset]'):
            # Handle src and href
            url = element.attrib.get('src') or element.attrib.get('href')
            if url:
                urls.add(response.urljoin(url))
            
            # Handle srcset for responsive images
            srcset = element.attrib.get('srcset')
            if srcset:
                # Split the srcset by comma and extract the URL part
                for src in srcset.split(','):
                    src_url = src.strip().split(' ')[0]
                    urls.add(response.urljoin(src_url))
        return urls

    def save_file(self, response):
        """Saves a response to a local file, stripping query parameters for filename."""
        parsed_url = urlparse(response.url)
        path = parsed_url.path.lstrip('/')
        
        # Determine the file path, ignoring any query parameters
        if not path or path.endswith('/'):
            # This is a directory URL, save as index.html
            file_path = self.output_dir / path / 'index.html'
        elif '.' not in Path(path).name:
            # This is a "clean" URL without an extension, treat as a directory
            file_path = self.output_dir / path / 'index.html'
        else:
            # This is a file with an extension
            file_path = self.output_dir / path
        
        # Create parent directories if they don't exist
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save the file
        try:
            with open(file_path, 'wb') as f:
                f.write(response.body)
            self.log(f"Saved {response.url} to {file_path}")
            yield {'path': str(file_path)}
        except Exception as e:
            self.log(f"Error saving {response.url} to {file_path}: {e}", level=logging.ERROR)

        content = response.body.decode('utf-8', errors='ignore')

        # If the saved file is CSS, parse it for more assets
        if file_path.suffix == '.css':
            # Find all url(...) declarations
            css_urls = re.findall(r'url\((?![\'"]?data:)(.*?)\)', content)
            for css_url in css_urls:
                # Clean up the URL (remove quotes)
                css_url = css_url.strip('\'"')
                full_url = response.urljoin(css_url)
                if full_url.startswith('http'):
                    yield scrapy.Request(full_url, callback=self.save_file)
        
        # If the saved file is JS, parse it for more assets
        elif file_path.suffix == '.js':
            # Find paths to assets within JS strings
            js_urls = re.findall(r'["\'](/wp-content/[^"\']+)["\']', content)
            for js_url in js_urls:
                full_url = response.urljoin(js_url)
                if full_url.startswith('http'):
                    yield scrapy.Request(full_url, callback=self.save_file)

def run_scraper(output_dir: str):
    """
    Configures and runs the Scrapy spider.
    """
    start_url = "https://ukuleletuesday.ie/"
    output_path = Path(output_dir)

    # Clean the output directory before starting
    if output_path.exists():
        shutil.rmtree(output_path)
    output_path.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Starting Scrapy export from {start_url} into {output_path}...")

    # Configure Scrapy settings
    settings = get_project_settings()
    settings.set('LOG_LEVEL', 'INFO')
    settings.set('USER_AGENT', 'UkuleleTuesday-Static-Exporter/1.0 (+https://github.com/ukuleletuesday/ukuleletuesday.ie)')
    
    process = CrawlerProcess(settings)
    process.crawl(StaticSiteSpider, start_url=start_url, output_dir=output_dir)
    
    try:
        process.start()  # This will block until the crawl is finished
        logger.info("✓ Scrapy export completed successfully.")
        return True
    except Exception as e:
        logger.error(f"✗ An error occurred during the Scrapy export: {e}")
        return False


