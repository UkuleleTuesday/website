import { test, expect } from '@playwright/test';

// Helper functions for test setup and cleanup
function clearModuleCache(modulePath: string) {
  delete require.cache[require.resolve(modulePath)];
}

function setupFetchMock(): { getCapturedUrl: () => string | undefined, restore: () => void } {
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

  return {
    getCapturedUrl: () => capturedUrl,
    restore: () => { global.fetch = originalFetch; }
  };
}

// These are unit tests for the Netlify function that test actual behavior,
// not just string matching in source files
test.describe('Calendar Netlify Function Behavior Tests', () => {
  const MODULE_PATH = '../netlify/functions/calendar.js';

  test.afterEach(() => {
    // Clean up module cache after each test
    clearModuleCache(MODULE_PATH);
  });

  test('should return 405 for non-GET requests', async () => {
    // This tests the actual function behavior without checking source code
    const calendarFunction = require(MODULE_PATH);
    
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

    try {
      clearModuleCache(MODULE_PATH);
      const calendarFunction = require(MODULE_PATH);
      
      const mockEvent = {
        httpMethod: 'GET'
      };

      const response = await calendarFunction.handler(mockEvent);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
      expect(body.error).toContain('API key');
    } finally {
      // Restore in finally block to ensure cleanup
      if (originalApiKey) {
        process.env.GOOGLE_CALENDAR_API_KEY = originalApiKey;
      }
    }
  });

  test('should make API request with optimized fields parameter', async () => {
    // Test the actual function behavior by mocking fetch
    const fetchMock = setupFetchMock();

    try {
      // Set test environment
      process.env.GOOGLE_CALENDAR_API_KEY = 'test-api-key-12345';
      clearModuleCache(MODULE_PATH);
      const calendarFunction = require(MODULE_PATH);
      
      const mockEvent = {
        httpMethod: 'GET'
      };

      const response = await calendarFunction.handler(mockEvent);

      // Verify successful response
      expect(response.statusCode).toBe(200);
      
      const capturedUrl = fetchMock.getCapturedUrl();
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
    } finally {
      fetchMock.restore();
      delete process.env.GOOGLE_CALENDAR_API_KEY;
    }
  });

  test('should not include unnecessary fields in API request', async () => {
    // This test verifies the optimization - that we're NOT requesting bloat fields
    const fetchMock = setupFetchMock();

    try {
      process.env.GOOGLE_CALENDAR_API_KEY = 'test-key';
      clearModuleCache(MODULE_PATH);
      const calendarFunction = require(MODULE_PATH);
      
      await calendarFunction.handler({ httpMethod: 'GET' });
      
      const capturedUrl = fetchMock.getCapturedUrl();
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
    } finally {
      fetchMock.restore();
      delete process.env.GOOGLE_CALENDAR_API_KEY;
    }
  });
});
