import { test, expect } from '@playwright/test';

// Test the calendar event description toggle functionality
test.describe('Calendar Event Description Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the Netlify function to return test events with descriptions
    await page.route('/.netlify/functions/calendar', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              summary: 'Test Concert Event',
              description: 'This is a test concert with a <strong>detailed</strong> description and a <a href="https://example.com">link</a>.\n#concert',
              location: 'Test Venue, Dublin',
              start: {
                dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
              }
            },
            {
              summary: 'Test Jam Session',
              description: 'Join us for a fun jam session!\n#jam',
              location: 'Test Pub, Dublin',
              start: {
                dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
              }
            },
            {
              summary: 'Event Without Description',
              location: 'Another Venue',
              start: {
                dateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString() // 21 days from now
              }
            }
          ]
        })
      });
    });

    // Navigate to the home page
    await page.goto('/');
    
    // Wait for the calendar events to load
    await page.waitForSelector('.calendar-event', { timeout: 5000 });
  });

  test('should display event description when clicked', async ({ page }) => {
    // Find the first event (Test Concert Event)
    const firstEvent = page.locator('.calendar-event').first();
    
    // Verify the description is initially hidden
    const description = firstEvent.locator('.event-description');
    await expect(description).toBeHidden();
    
    // Click on the event
    await firstEvent.click();
    
    // Verify the description is now visible
    await expect(description).toBeVisible();
    await expect(description).toContainText('This is a test concert with a');
  });

  test('should hide event description when clicked again', async ({ page }) => {
    const firstEvent = page.locator('.calendar-event').first();
    const description = firstEvent.locator('.event-description');
    
    // Click to show
    await firstEvent.click();
    await expect(description).toBeVisible();
    
    // Click to hide
    await firstEvent.click();
    await expect(description).toBeHidden();
  });

  test('should toggle description with keyboard (Enter key)', async ({ page }) => {
    const firstEvent = page.locator('.calendar-event').first();
    const description = firstEvent.locator('.event-description');
    
    // Focus on the event
    await firstEvent.focus();
    
    // Press Enter to show description
    await page.keyboard.press('Enter');
    await expect(description).toBeVisible();
    
    // Press Enter again to hide description
    await page.keyboard.press('Enter');
    await expect(description).toBeHidden();
  });

  test('should toggle description with keyboard (Space key)', async ({ page }) => {
    const firstEvent = page.locator('.calendar-event').first();
    const description = firstEvent.locator('.event-description');
    
    // Focus on the event
    await firstEvent.focus();
    
    // Press Space to show description
    await page.keyboard.press('Space');
    await expect(description).toBeVisible();
    
    // Press Space again to hide description
    await page.keyboard.press('Space');
    await expect(description).toBeHidden();
  });

  test('should not add click handlers to events without descriptions', async ({ page }) => {
    // Find the third event (Event Without Description)
    const thirdEvent = page.locator('.calendar-event').nth(2);
    
    // Verify it doesn't have the role="button" attribute
    await expect(thirdEvent).not.toHaveAttribute('role', 'button');
    
    // Verify it doesn't have a description element
    const description = thirdEvent.locator('.event-description');
    await expect(description).toHaveCount(0);
    
    // Verify it doesn't have a toggle indicator
    const toggleIndicator = thirdEvent.locator('.toggle-indicator');
    await expect(toggleIndicator).toHaveCount(0);
  });

  test('should update aria-expanded attribute when toggling', async ({ page }) => {
    const firstEvent = page.locator('.calendar-event').first();
    
    // Initially should be aria-expanded="false"
    await expect(firstEvent).toHaveAttribute('aria-expanded', 'false');
    
    // Click to expand
    await firstEvent.click();
    await expect(firstEvent).toHaveAttribute('aria-expanded', 'true');
    
    // Click to collapse
    await firstEvent.click();
    await expect(firstEvent).toHaveAttribute('aria-expanded', 'false');
  });

  test('should have cursor pointer for events with descriptions', async ({ page }) => {
    const firstEvent = page.locator('.calendar-event').first();
    
    // Verify the event has the role="button" attribute
    await expect(firstEvent).toHaveAttribute('role', 'button');
    
    // Verify the cursor style is pointer (via CSS)
    const cursor = await firstEvent.evaluate((el) => 
      window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
  });

  test('should handle multiple events independently', async ({ page }) => {
    const firstEvent = page.locator('.calendar-event').first();
    const secondEvent = page.locator('.calendar-event').nth(1);
    
    const firstDescription = firstEvent.locator('.event-description');
    const secondDescription = secondEvent.locator('.event-description');
    
    // Click first event
    await firstEvent.click();
    await expect(firstDescription).toBeVisible();
    await expect(secondDescription).toBeHidden();
    
    // Click second event
    await secondEvent.click();
    await expect(firstDescription).toBeVisible();
    await expect(secondDescription).toBeVisible();
    
    // Click first event again
    await firstEvent.click();
    await expect(firstDescription).toBeHidden();
    await expect(secondDescription).toBeVisible();
  });

  test('should display toggle indicator for events with descriptions', async ({ page }) => {
    const firstEvent = page.locator('.calendar-event').first();
    const toggleIndicator = firstEvent.locator('.toggle-indicator');
    
    // Verify toggle indicator exists
    await expect(toggleIndicator).toBeVisible();
    
    // Verify it's initially not rotated (expanded class not present)
    await expect(toggleIndicator).not.toHaveClass(/toggle-indicator--expanded/);
  });

  test('should rotate toggle indicator when expanded', async ({ page }) => {
    const firstEvent = page.locator('.calendar-event').first();
    const toggleIndicator = firstEvent.locator('.toggle-indicator');
    
    // Click to expand
    await firstEvent.click();
    
    // Verify toggle indicator has expanded class
    await expect(toggleIndicator).toHaveClass(/toggle-indicator--expanded/);
    
    // Click to collapse
    await firstEvent.click();
    
    // Verify toggle indicator no longer has expanded class
    await expect(toggleIndicator).not.toHaveClass(/toggle-indicator--expanded/);
  });

  test('should render HTML content safely in descriptions', async ({ page }) => {
    const firstEvent = page.locator('.calendar-event').first();
    
    // Click to show description
    await firstEvent.click();
    
    const description = firstEvent.locator('.event-description');
    
    // Verify that <strong> tag is rendered
    const strongElement = description.locator('strong');
    await expect(strongElement).toBeVisible();
    await expect(strongElement).toHaveText('detailed');
    
    // Verify that <a> tag is rendered with proper attributes
    const linkElement = description.locator('a');
    await expect(linkElement).toBeVisible();
    await expect(linkElement).toHaveAttribute('href', 'https://example.com');
    await expect(linkElement).toHaveAttribute('target', '_blank');
    await expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should show description before location', async ({ page }) => {
    const firstEvent = page.locator('.calendar-event').first();
    
    // Click to show description
    await firstEvent.click();
    
    // Get all child elements
    const titleWrapper = firstEvent.locator('.event-title-wrapper');
    const description = firstEvent.locator('.event-description');
    const location = firstEvent.locator('.event-location');
    
    // Verify elements exist
    await expect(titleWrapper).toBeVisible();
    await expect(description).toBeVisible();
    await expect(location).toBeVisible();
    
    // Get bounding boxes to verify order (description should be above location)
    const descBox = await description.boundingBox();
    const locBox = await location.boundingBox();
    
    expect(descBox).not.toBeNull();
    expect(locBox).not.toBeNull();
    
    if (descBox && locBox) {
      // Description should be above (smaller y coordinate) location
      expect(descBox.y).toBeLessThan(locBox.y);
    }
  });
});
