import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Cache Headers Configuration', () => {
  test('should verify netlify.toml has correct cache headers for CSS and JS', async () => {
    // Read the netlify.toml file
    const netlifyTomlPath = path.join(__dirname, '..', 'netlify.toml');
    const netlifyTomlContent = fs.readFileSync(netlifyTomlPath, 'utf8');
    
    // Verify CSS files have short cache (5 minutes = 300 seconds) with stale-while-revalidate
    expect(netlifyTomlContent).toContain('for = "/*.css"');
    expect(netlifyTomlContent).toMatch(/for = "\/\*\.css"[\s\S]*?Cache-Control = "public, max-age=300, stale-while-revalidate=86400"/);
    
    // Verify JS files have short cache (5 minutes = 300 seconds) with stale-while-revalidate
    expect(netlifyTomlContent).toContain('for = "/*.js"');
    expect(netlifyTomlContent).toMatch(/for = "\/\*\.js"[\s\S]*?Cache-Control = "public, max-age=300, stale-while-revalidate=86400"/);
    
    // Verify CSS and JS do NOT have immutable cache
    const cssSection = netlifyTomlContent.match(/for = "\/\*\.css"[\s\S]*?Cache-Control = "[^"]*"/)?.[0] || '';
    const jsSection = netlifyTomlContent.match(/for = "\/\*\.js"[\s\S]*?Cache-Control = "[^"]*"/)?.[0] || '';
    
    expect(cssSection).not.toContain('immutable');
    expect(jsSection).not.toContain('immutable');
    expect(cssSection).not.toContain('max-age=31536000');
    expect(jsSection).not.toContain('max-age=31536000');
  });

  test('should verify edge function endpoints have no-store cache headers', async () => {
    // Read the netlify.toml file
    const netlifyTomlPath = path.join(__dirname, '..', 'netlify.toml');
    const netlifyTomlContent = fs.readFileSync(netlifyTomlPath, 'utf8');
    
    // Verify /donate has no-store cache control
    expect(netlifyTomlContent).toMatch(/for = "\/donate"[\s\S]*?Cache-Control = "no-store"/);
    
    // Verify /donate-qr has no-store cache control
    expect(netlifyTomlContent).toMatch(/for = "\/donate-qr"[\s\S]*?Cache-Control = "no-store"/);
    
    // Verify /support-us has no-store cache control
    expect(netlifyTomlContent).toMatch(/for = "\/support-us"[\s\S]*?Cache-Control = "no-store"/);
  });

  test('should verify HTML files maintain short cache with stale-while-revalidate', async () => {
    // Read the netlify.toml file
    const netlifyTomlPath = path.join(__dirname, '..', 'netlify.toml');
    const netlifyTomlContent = fs.readFileSync(netlifyTomlPath, 'utf8');
    
    // Verify HTML files (/* pattern) have 60 second cache with stale-while-revalidate
    expect(netlifyTomlContent).toContain('for = "/*"');
    expect(netlifyTomlContent).toMatch(/for = "\/\*"[\s\S]*?Cache-Control = "public, max-age=60, stale-while-revalidate=86400"/);
  });

  test('should verify images and fonts retain long cache with immutable', async () => {
    // Read the netlify.toml file
    const netlifyTomlPath = path.join(__dirname, '..', 'netlify.toml');
    const netlifyTomlContent = fs.readFileSync(netlifyTomlPath, 'utf8');
    
    // Verify images have long cache with immutable
    expect(netlifyTomlContent).toMatch(/for = "\/images\/\*"[\s\S]*?Cache-Control = "public, max-age=31536000, immutable"/);
    
    // Verify fonts have long cache with immutable
    expect(netlifyTomlContent).toMatch(/for = "\/fonts\/\*"[\s\S]*?Cache-Control = "public, max-age=31536000, immutable"/);
  });
});
