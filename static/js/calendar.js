/**
 * Google Calendar API Client
 * Fetches and displays upcoming events from Google Calendar
 */

// Use Netlify function to fetch calendar data (handles API key)
const CALENDAR_API_URL = '/.netlify/functions/calendar';

/**
 * Determine event type based on description
 */
function getEventType(event) {
  const description = (event.description || '').toLowerCase();
  const summary = (event.summary || '').toLowerCase();
  const text = description + ' ' + summary;
  
  // Check for jam session keywords
  if (text.match(/play-along|jam|session/i)) {
    return 'jam-session';
  }
  
  // Default to concert
  return 'concert';
}

/**
 * Format date for display
 */
function formatEventDate(startDateTime, isAllDay) {
  if (!startDateTime) return '';
  
  const start = new Date(startDateTime);
  
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  let formatted = start.toLocaleDateString('en-IE', options);
  
  if (!isAllDay) {
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    formatted += ' at ' + start.toLocaleTimeString('en-IE', timeOptions);
  }
  
  return formatted;
}

/**
 * Fetch calendar events from Google Calendar API
 */
async function fetchCalendarEvents() {
  try {
    const response = await fetch(CALENDAR_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const events = data.items || [];
    
    // Sort events by start time (client-side sorting since we can't use orderBy=startTime without singleEvents=true)
    events.sort((a, b) => {
      const aStart = a.start.dateTime || a.start.date;
      const bStart = b.start.dateTime || b.start.date;
      return new Date(aStart) - new Date(bStart);
    });
    
    return events;
  } catch (error) {
    console.error('Error fetching calendar:', error);
    throw error;
  }
}

/**
 * Render events to the DOM
 */
function renderEvents(events, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }
  
  if (events.length === 0) {
    container.innerHTML = '<p class="no-events">No upcoming events at this time. Check back soon!</p>';
    return;
  }
  
  const eventsHTML = events.map(event => {
    // Google Calendar API returns start.dateTime for timed events or start.date for all-day events
    const startDateTime = event.start.dateTime || event.start.date;
    const isAllDay = !event.start.dateTime; // If no dateTime, it's an all-day event
    const eventType = getEventType(event);
    
    const dateStr = formatEventDate(startDateTime, isAllDay);
    const location = event.location ? `<div class="event-location">📍 ${escapeHtml(event.location)}</div>` : '';
    
    return `
      <div class="calendar-event ${eventType}">
        <div class="event-date">${dateStr}</div>
        <div class="event-title">${escapeHtml(event.summary || 'Untitled Event')}</div>
        ${location}
      </div>
    `;
  }).join('');
  
  container.innerHTML = eventsHTML;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize the calendar
 */
async function initCalendar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }
  
  // Show loading state
  container.innerHTML = '<p class="loading-events">Loading upcoming events...</p>';
  
  try {
    const events = await fetchCalendarEvents();
    renderEvents(events, containerId);
  } catch (error) {
    container.innerHTML = '<p class="error-events">Unable to load events. Please try again later.</p>';
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initCalendar('upcoming-events-list');
  });
} else {
  initCalendar('upcoming-events-list');
}
