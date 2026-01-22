/**
 * Netlify Function to fetch Google Calendar events using the Calendar API
 * This uses the API key from environment variables
 */
exports.handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    };
  }

  const { GOOGLE_CALENDAR_API_KEY } = process.env;
  
  if (!GOOGLE_CALENDAR_API_KEY) {
    console.error('GOOGLE_CALENDAR_API_KEY environment variable is not set.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: API key not available.' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    };
  }

  const CALENDAR_ID = '3a583720ada6b96add65d4dc75539408da8d79876140c012f4eb81b8b7fd1bb1@group.calendar.google.com';
  const MAX_RESULTS = 20;
  
  // Get current time in RFC3339 format
  const timeMin = new Date().toISOString();
  
  // Build Google Calendar API URL
  const apiUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(CALENDAR_ID) + '/events');
  apiUrl.searchParams.set('key', GOOGLE_CALENDAR_API_KEY);
  apiUrl.searchParams.set('timeMin', timeMin);
  apiUrl.searchParams.set('maxResults', MAX_RESULTS.toString());

  try {
    // Fetch events from Google Calendar API
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Calendar API error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the events data with proper CORS headers
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    };
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch calendar data' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    };
  }
};
