/**
 * Netlify Function to fetch Google Calendar ICS data
 * This acts as a proxy to avoid CORS issues when fetching from the browser
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

  const CALENDAR_ICS_URL = 'https://calendar.google.com/calendar/ical/3a583720ada6b96add65d4dc75539408da8d79876140c012f4eb81b8b7fd1bb1%40group.calendar.google.com/public/basic.ics';

  try {
    // Fetch the ICS data from Google Calendar
    const response = await fetch(CALENDAR_ICS_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const icsData = await response.text();
    
    // Return the ICS data with proper CORS headers
    return {
      statusCode: 200,
      body: icsData,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
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
