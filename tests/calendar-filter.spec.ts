import { test, expect } from '@playwright/test';

// Test the calendar event filtering functionality
test.describe('Calendar Event Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the Netlify function to return test events of different types
    await page.route('/.netlify/functions/calendar', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              summary: 'Tuesday Play-Along Session',
              description: 'Join us for our weekly jam session! #jam',
              location: 'The Stags Head, Dublin',
              start: {
                dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              }
            },
            {
              summary: 'Concert at Temple Bar',
              description: 'Live concert performance #concert',
              location: 'Temple Bar, Dublin',
              start: {
                dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
              }
            },
            {
              summary: 'Community Meetup',
              description: 'Community gathering for ukulele enthusiasts',
              location: 'Community Center, Dublin',
              start: {
                dateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
              }
            },
            {
              summary: 'Another Play-Along',
              description: 'Weekly session continues! #playalong',
              location: 'The Stags Head, Dublin',
              start: {
                dateTime: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()
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

  test('should display all event types by default', async ({ page }) => {
    // Verify all checkboxes are checked by default
    const playAlongCheckbox = page.locator('#filter-jam-session');
    const concertCheckbox = page.locator('#filter-concert');
    const otherCheckbox = page.locator('#filter-other');

    await expect(playAlongCheckbox).toBeChecked();
    await expect(concertCheckbox).toBeChecked();
    await expect(otherCheckbox).toBeChecked();

    // Verify all events are visible (4 total)
    const events = page.locator('.calendar-event');
    await expect(events).toHaveCount(4);
  });

  test('should filter out play-along events when unchecked', async ({ page }) => {
    // Uncheck the play-along filter
    await page.locator('#filter-jam-session').uncheck();

    // Should show only 2 events (concert and other)
    const events = page.locator('.calendar-event');
    await expect(events).toHaveCount(2);

    // Verify the remaining events are concert and other types
    const concertEvent = events.filter({ hasText: 'Concert at Temple Bar' });
    const otherEvent = events.filter({ hasText: 'Community Meetup' });
    
    await expect(concertEvent).toBeVisible();
    await expect(otherEvent).toBeVisible();
  });

  test('should filter out concert events when unchecked', async ({ page }) => {
    // Uncheck the concert filter
    await page.locator('#filter-concert').uncheck();

    // Should show 3 events (2 play-along + 1 other)
    const events = page.locator('.calendar-event');
    await expect(events).toHaveCount(3);

    // Verify play-along and other events are visible
    const playAlongEvent = events.filter({ hasText: 'Tuesday Play-Along Session' });
    const otherEvent = events.filter({ hasText: 'Community Meetup' });
    
    await expect(playAlongEvent).toBeVisible();
    await expect(otherEvent).toBeVisible();
  });

  test('should filter out other events when unchecked', async ({ page }) => {
    // Uncheck the other filter
    await page.locator('#filter-other').uncheck();

    // Should show 3 events (2 play-along + 1 concert)
    const events = page.locator('.calendar-event');
    await expect(events).toHaveCount(3);

    // Verify play-along and concert events are visible
    const playAlongEvent = events.filter({ hasText: 'Tuesday Play-Along Session' });
    const concertEvent = events.filter({ hasText: 'Concert at Temple Bar' });
    
    await expect(playAlongEvent).toBeVisible();
    await expect(concertEvent).toBeVisible();
  });

  test('should show only play-along events when others are unchecked', async ({ page }) => {
    // Uncheck concert and other filters
    await page.locator('#filter-concert').uncheck();
    await page.locator('#filter-other').uncheck();

    // Should show only 2 play-along events
    const events = page.locator('.calendar-event');
    await expect(events).toHaveCount(2);

    // Verify both are play-along events
    const playAlongEvent1 = events.filter({ hasText: 'Tuesday Play-Along Session' });
    const playAlongEvent2 = events.filter({ hasText: 'Another Play-Along' });
    
    await expect(playAlongEvent1).toBeVisible();
    await expect(playAlongEvent2).toBeVisible();
  });

  test('should show empty state message when all filters are unchecked', async ({ page }) => {
    // Uncheck all filters
    await page.locator('#filter-jam-session').uncheck();
    await page.locator('#filter-concert').uncheck();
    await page.locator('#filter-other').uncheck();

    // Verify no events are visible
    const events = page.locator('.calendar-event');
    await expect(events).toHaveCount(0);

    // Verify the empty state message is shown
    const emptyMessage = page.locator('.no-events');
    await expect(emptyMessage).toBeVisible();
    await expect(emptyMessage).toContainText('No upcoming events match your filter. Try adjusting your filters!');
  });

  test('should restore events when filters are rechecked', async ({ page }) => {
    // Uncheck all filters
    await page.locator('#filter-jam-session').uncheck();
    await page.locator('#filter-concert').uncheck();
    await page.locator('#filter-other').uncheck();

    // Verify no events
    let events = page.locator('.calendar-event');
    await expect(events).toHaveCount(0);

    // Re-check all filters
    await page.locator('#filter-jam-session').check();
    await page.locator('#filter-concert').check();
    await page.locator('#filter-other').check();

    // Verify all 4 events are back
    events = page.locator('.calendar-event');
    await expect(events).toHaveCount(4);
  });

  test('should maintain event order when filtering', async ({ page }) => {
    // Get initial event order
    const allEvents = page.locator('.calendar-event .event-title');
    const firstEventTitle = await allEvents.nth(0).textContent();
    const lastEventTitle = await allEvents.nth(3).textContent();

    // Filter to show only play-along events
    await page.locator('#filter-concert').uncheck();
    await page.locator('#filter-other').uncheck();

    // Verify order is maintained (first and last play-along events)
    const filteredEvents = page.locator('.calendar-event .event-title');
    await expect(filteredEvents.nth(0)).toHaveText(firstEventTitle || '');
    await expect(filteredEvents.nth(1)).toHaveText(lastEventTitle || '');
  });

  test('should filter events without refetching from API', async ({ page }) => {
    // Track API calls
    let apiCallCount = 0;
    await page.route('/.netlify/functions/calendar', async (route) => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              summary: 'Test Event',
              description: '#jam',
              start: {
                dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          ]
        })
      });
    });

    // Initial load
    await page.goto('/');
    await page.waitForSelector('.calendar-event', { timeout: 5000 });
    
    const initialApiCalls = apiCallCount;

    // Toggle filters multiple times
    await page.locator('#filter-concert').uncheck();
    await page.locator('#filter-concert').check();
    await page.locator('#filter-jam-session').uncheck();
    await page.locator('#filter-jam-session').check();

    // Verify API was not called again
    expect(apiCallCount).toBe(initialApiCalls);
  });

  test('should have accessible labels for checkboxes', async ({ page }) => {
    // Verify checkboxes have proper labels
    const playAlongLabel = page.locator('label[for="filter-jam-session"]');
    const concertLabel = page.locator('label[for="filter-concert"]');
    const otherLabel = page.locator('label[for="filter-other"]');

    await expect(playAlongLabel).toContainText('Play-Along');
    await expect(concertLabel).toContainText('Concert');
    await expect(otherLabel).toContainText('Other');
  });

  test('should toggle filter when clicking on label', async ({ page }) => {
    const playAlongCheckbox = page.locator('#filter-jam-session');
    const playAlongLabel = page.locator('label[for="filter-jam-session"]');

    // Verify initial state
    await expect(playAlongCheckbox).toBeChecked();

    // Click on label (not checkbox)
    await playAlongLabel.click();

    // Verify checkbox is unchecked
    await expect(playAlongCheckbox).not.toBeChecked();

    // Click label again
    await playAlongLabel.click();

    // Verify checkbox is checked again
    await expect(playAlongCheckbox).toBeChecked();
  });
});
