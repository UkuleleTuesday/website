/**
 * Calendar ICS Parser
 * Fetches and parses Google Calendar ICS feed to display upcoming events
 */

// Use Netlify function to proxy the ICS data (avoids CORS issues)
const CALENDAR_ICS_URL = '/.netlify/functions/calendar-ics';
const MAX_EVENTS = 20;

/**
 * Parse ICS format date string to JavaScript Date
 * Handles both UTC (YYYYMMDDTHHMMSSZ) and local (YYYYMMDDTHHMMSS) formats
 */
function parseICSDate(dateString) {
  if (!dateString) return null;
  
  // Remove TZID info if present
  dateString = dateString.split(':').pop();
  
  // Handle all-day events (just date, no time)
  if (dateString.length === 8) {
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1;
    const day = parseInt(dateString.substring(6, 8));
    return new Date(year, month, day);
  }
  
  // Handle date-time events
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1;
  const day = parseInt(dateString.substring(6, 8));
  const hour = parseInt(dateString.substring(9, 11));
  const minute = parseInt(dateString.substring(11, 13));
  const second = parseInt(dateString.substring(13, 15));
  
  // Check if it's UTC (ends with Z)
  if (dateString.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  } else {
    return new Date(year, month, day, hour, minute, second);
  }
}

/**
 * Format date for display
 */
function formatEventDate(date, isAllDay) {
  if (!date) return '';
  
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  let formatted = date.toLocaleDateString('en-IE', options);
  
  if (!isAllDay) {
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    formatted += ' at ' + date.toLocaleTimeString('en-IE', timeOptions);
  }
  
  return formatted;
}

/**
 * Parse ICS content into event objects
 */
function parseICS(icsContent) {
  const events = [];
  const lines = icsContent.split(/\r?\n/);
  let currentEvent = null;
  let currentProperty = null;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Handle line continuations (lines starting with space or tab)
    while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
      i++;
      line += lines[i].trim();
    }
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {
        summary: '',
        description: '',
        location: '',
        start: null,
        end: null,
        isAllDay: false
      };
    } else if (line === 'END:VEVENT' && currentEvent) {
      // Only add future events
      if (currentEvent.start && currentEvent.start > new Date()) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const fullProperty = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);
      
      // Extract property name (before any semicolon for parameters)
      const property = fullProperty.split(';')[0];
      
      if (property === 'SUMMARY') {
        currentEvent.summary = value.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
      } else if (property === 'DESCRIPTION') {
        currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
      } else if (property === 'LOCATION') {
        currentEvent.location = value.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
      } else if (property === 'DTSTART') {
        currentEvent.start = parseICSDate(value);
        // Check if it's an all-day event (VALUE=DATE parameter)
        if (fullProperty.includes('VALUE=DATE')) {
          currentEvent.isAllDay = true;
        }
      } else if (property === 'DTEND') {
        currentEvent.end = parseICSDate(value);
      }
    }
  }
  
  return events;
}

/**
 * Fetch and parse the calendar ICS file
 */
async function fetchCalendarEvents() {
  try {
    const response = await fetch(CALENDAR_ICS_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const icsContent = await response.text();
    return parseICS(icsContent);
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
  
  // Sort events by date
  events.sort((a, b) => a.start - b.start);
  
  // Take only the next MAX_EVENTS
  const upcomingEvents = events.slice(0, MAX_EVENTS);
  
  const eventsHTML = upcomingEvents.map(event => {
    const dateStr = formatEventDate(event.start, event.isAllDay);
    const location = event.location ? `<div class="event-location">📍 ${escapeHtml(event.location)}</div>` : '';
    
    return `
      <div class="calendar-event">
        <div class="event-date">${dateStr}</div>
        <div class="event-title">${escapeHtml(event.summary)}</div>
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
