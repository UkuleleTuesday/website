import { test, expect } from '@playwright/test';

// These are unit tests for the Netlify function that test actual behavior,
// not just string matching in source files
test.describe('Calendar Netlify Function Behavior Tests', () => {
  test('should return 405 for non-GET requests', async () => {
    // This tests the actual function behavior without checking source code
    const calendarFunction = require('../netlify/functions/calendar.js');
    
    const mockEvent = {
      httpMethod: 'POST'
    };

    const response = await calendarFunction.handler(mockEvent);

    expect(response.statusCode).toBe(405);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('error');
    expect(body.error).toBe('Method Not Allowed');
  });

  test('should return 500 when API key is missing', async () => {
    // Save and clear API key
    const originalApiKey = process.env.GOOGLE_CALENDAR_API_KEY;
    delete process.env.GOOGLE_CALENDAR_API_KEY;

    // Clear require cache for fresh module load
    delete require.cache[require.resolve('../netlify/functions/calendar.js')];
    const calendarFunction = require('../netlify/functions/calendar.js');
    
    const mockEvent = {
      httpMethod: 'GET'
    };

    const response = await calendarFunction.handler(mockEvent);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('API key');
    
    // Restore
    if (originalApiKey) {
      process.env.GOOGLE_CALENDAR_API_KEY = originalApiKey;
    }
    delete require.cache[require.resolve('../netlify/functions/calendar.js')];
  });

  test('should make API request with optimized fields parameter', async () => {
    // Test the actual function behavior by mocking fetch
    let capturedUrl: string | undefined;
    const originalFetch = global.fetch;
    
    // Mock fetch to capture the URL and return a valid response
    global.fetch = async (url: string | URL | Request) => {
      capturedUrl = typeof url === 'string' ? url : 
                    url instanceof URL ? url.toString() : 
                    url.url;
      
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    // Set test environment
    process.env.GOOGLE_CALENDAR_API_KEY = 'test-api-key-12345';
    delete require.cache[require.resolve('../netlify/functions/calendar.js')];
    const calendarFunction = require('../netlify/functions/calendar.js');
    
    const mockEvent = {
      httpMethod: 'GET'
    };

    const response = await calendarFunction.handler(mockEvent);

    // Restore fetch
    global.fetch = originalFetch;

    // Verify successful response
    expect(response.statusCode).toBe(200);
    expect(capturedUrl).toBeDefined();
    
    // Parse and verify the URL that was called
    if (capturedUrl) {
      const url = new URL(capturedUrl);
      
      // Test the fields parameter contains ONLY the required fields
      const fieldsParam = url.searchParams.get('fields');
      expect(fieldsParam).toBe('items(summary,description,location,start(dateTime,date))');
      
      // Verify it's requesting the essential fields
      expect(fieldsParam).toContain('summary');
      expect(fieldsParam).toContain('description');
      expect(fieldsParam).toContain('location');
      expect(fieldsParam).toContain('start');
      
      // Verify other API parameters are correct
      expect(url.searchParams.get('key')).toBe('test-api-key-12345');
      expect(url.searchParams.get('singleEvents')).toBe('true');
      expect(url.searchParams.get('orderBy')).toBe('startTime');
      expect(url.searchParams.get('maxResults')).toBe('10');
      expect(url.searchParams.has('timeMin')).toBe(true);
      
      // Verify the URL points to Google Calendar API
      expect(url.hostname).toBe('www.googleapis.com');
      expect(url.pathname).toContain('/calendar/v3/calendars/');
      expect(url.pathname).toContain('/events');
    }
    
    // Cleanup
    delete process.env.GOOGLE_CALENDAR_API_KEY;
    delete require.cache[require.resolve('../netlify/functions/calendar.js')];
  });

  test('should not include unnecessary fields in API request', async () => {
    // This test verifies the optimization - that we're NOT requesting bloat fields
    let capturedUrl: string | undefined;
    const originalFetch = global.fetch;
    
    global.fetch = async (url: string | URL | Request) => {
      capturedUrl = typeof url === 'string' ? url : 
                    url instanceof URL ? url.toString() : 
                    url.url;
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    process.env.GOOGLE_CALENDAR_API_KEY = 'test-key';
    delete require.cache[require.resolve('../netlify/functions/calendar.js')];
    const calendarFunction = require('../netlify/functions/calendar.js');
    
    await calendarFunction.handler({ httpMethod: 'GET' });

    global.fetch = originalFetch;
    
    if (capturedUrl) {
      const url = new URL(capturedUrl);
      const fieldsParam = url.searchParams.get('fields') || '';
      
      // Verify the bloat fields that were in the original 15KB payload are NOT included
      expect(fieldsParam).not.toContain('etag');
      expect(fieldsParam).not.toContain('htmlLink');
      expect(fieldsParam).not.toContain('created');
      expect(fieldsParam).not.toContain('updated');
      expect(fieldsParam).not.toContain('creator');
      expect(fieldsParam).not.toContain('organizer');
      expect(fieldsParam).not.toContain('iCalUID');
      expect(fieldsParam).not.toContain('end'); // We only need start time
      expect(fieldsParam).not.toContain('sequence');
      expect(fieldsParam).not.toContain('status');
      expect(fieldsParam).not.toContain('recurringEventId');
    }
    
    delete process.env.GOOGLE_CALENDAR_API_KEY;
    delete require.cache[require.resolve('../netlify/functions/calendar.js')];
  });
});
