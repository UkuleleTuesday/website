import { test, expect } from '@playwright/test';

test.describe('Calendar Netlify Function', () => {
  test('should verify calendar.js function exists and has field optimization', async () => {
    // Verify the function file exists and contains field filtering logic
    const fs = require('fs');
    const path = require('path');
    
    const calendarJsPath = path.join(__dirname, '..', 'netlify', 'functions', 'calendar.js');
    const calendarJsContent = fs.readFileSync(calendarJsPath, 'utf8');
    
    // Verify key functionality is present
    expect(calendarJsContent).toContain('GOOGLE_CALENDAR_API_KEY');
    expect(calendarJsContent).toContain('calendar/v3/calendars');
    expect(calendarJsContent).toContain('singleEvents');
    expect(calendarJsContent).toContain('orderBy');
    
    // Verify field optimization is present - this reduces payload size
    expect(calendarJsContent).toContain('fields');
    expect(calendarJsContent).toContain('items(summary,description,location,start(dateTime,date))');
  });

  test('should only request fields that are used by the frontend', async () => {
    // Verify that the fields parameter includes all fields used by calendar.js frontend
    const fs = require('fs');
    const path = require('path');
    
    const calendarJsPath = path.join(__dirname, '..', 'netlify', 'functions', 'calendar.js');
    const calendarJsContent = fs.readFileSync(calendarJsPath, 'utf8');
    
    // Extract the fields parameter value
    const fieldsMatch = calendarJsContent.match(/fields['"]?\s*,\s*['"]([^'"]+)['"]/);
    expect(fieldsMatch).toBeTruthy();
    
    if (fieldsMatch) {
      const fieldsValue = fieldsMatch[1];
      
      // Verify all required fields are present
      expect(fieldsValue).toContain('summary');
      expect(fieldsValue).toContain('description');
      expect(fieldsValue).toContain('location');
      expect(fieldsValue).toContain('start');
      expect(fieldsValue).toContain('dateTime');
      expect(fieldsValue).toContain('date');
      
      // Verify unnecessary fields are NOT present
      expect(fieldsValue).not.toContain('etag');
      expect(fieldsValue).not.toContain('htmlLink');
      expect(fieldsValue).not.toContain('created');
      expect(fieldsValue).not.toContain('updated');
      expect(fieldsValue).not.toContain('creator');
      expect(fieldsValue).not.toContain('organizer');
      expect(fieldsValue).not.toContain('iCalUID');
    }
  });
});
