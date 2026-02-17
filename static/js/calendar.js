/**
 * Google Calendar API Client
 * Fetches and displays upcoming events from Google Calendar
 */

// Use Netlify function to fetch calendar data (handles API key)
const CALENDAR_API_URL = '/.netlify/functions/calendar';

/**
 * Determine event type based on hashtags (primary) and keywords (fallback)
 * 
 * Classification rules:
 * - #jam or #playalong in description/summary → jam-session
 * - #concert in description/summary → concert
 * - Fallback: check for keywords "play-along", "jam" → jam-session
 * - No hashtags found → other (community group practices, etc.)
 * - Default: other (for events with unrecognized hashtags)
 */
function getEventType(event) {
  const description = (event.description || '').toLowerCase();
  const summary = (event.summary || '').toLowerCase();
  const text = `${description} ${summary}`;

  if (text.includes('#jam') || text.includes('#playalong')) {
    return 'jam-session';
  }

  if (text.includes('#concert')) {
    return 'concert';
  }

  return 'other';
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
    let events = data.items || [];
    
    // Filter to only include future events (past current date and time)
    const now = new Date();
    events = events.filter(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      return eventStart > now;
    });
    
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
  
  const eventsHTML = events.map((event, index) => {
    // Google Calendar API returns start.dateTime for timed events or start.date for all-day events
    const startDateTime = event.start.dateTime || event.start.date;
    const isAllDay = !event.start.dateTime; // If no dateTime, it's an all-day event
    const eventType = getEventType(event);
    
    const dateStr = formatEventDate(startDateTime, isAllDay);
    const location = event.location ? `<div class="event-location">📍 ${escapeHtml(event.location)}</div>` : '';
    const description = event.description ? `<div class="event-description event-description--hidden" id="event-desc-${index}">${sanitizeHtml(event.description)}</div>` : '';
    const toggleIndicator = event.description ? `<span class="toggle-indicator" aria-hidden="true">▼</span>` : '';
    
    return `
      <div class="calendar-event ${eventType}" data-event-index="${index}" ${description ? 'role="button" tabindex="0" aria-expanded="false" aria-controls="event-desc-' + index + '"' : ''}>
        <div class="event-date">${dateStr}</div>
        <div class="event-title-wrapper">
          <div class="event-title">${escapeHtml(event.summary || 'Untitled Event')}</div>
          ${toggleIndicator}
        </div>
        ${description}
        ${location}
      </div>
    `;
  }).join('');
  
  container.innerHTML = eventsHTML;
  
  // Add click/touch handlers for events with descriptions
  const eventElements = container.querySelectorAll('.calendar-event');
  events.forEach((event, index) => {
    if (event.description) {
      const eventElement = eventElements[index];
      const descriptionElement = document.getElementById(`event-desc-${index}`);
      
      if (eventElement && descriptionElement) {
        const toggleIndicator = eventElement.querySelector('.toggle-indicator');
        
        const toggleDescription = () => {
          const isExpanded = eventElement.getAttribute('aria-expanded') === 'true';
          if (isExpanded) {
            descriptionElement.classList.add('event-description--hidden');
            eventElement.setAttribute('aria-expanded', 'false');
            if (toggleIndicator) toggleIndicator.classList.remove('toggle-indicator--expanded');
          } else {
            descriptionElement.classList.remove('event-description--hidden');
            eventElement.setAttribute('aria-expanded', 'true');
            if (toggleIndicator) toggleIndicator.classList.add('toggle-indicator--expanded');
          }
        };
        
        eventElement.addEventListener('click', toggleDescription);
        eventElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            toggleDescription();
          }
        });
      }
    }
  });
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
 * Sanitize HTML content to allow safe basic HTML tags
 * Allows: <a>, <b>, <i>, <strong>, <em>, <br>, <p>
 */
function sanitizeHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Remove potentially dangerous elements and attributes
  const allowedTags = ['A', 'B', 'I', 'STRONG', 'EM', 'BR', 'P', 'UL', 'OL', 'LI'];
  const allowedAttributes = ['href', 'title'];
  
  function cleanNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Remove disallowed tags but preserve their text content
      if (!allowedTags.includes(node.tagName)) {
        // First, recursively clean all children
        Array.from(node.childNodes).forEach(cleanNode);
        
        // Then replace this node with its children (unwrap it)
        const fragment = document.createDocumentFragment();
        while (node.firstChild) {
          fragment.appendChild(node.firstChild);
        }
        node.parentNode.replaceChild(fragment, node);
        return;
      }
      
      // Remove disallowed attributes
      Array.from(node.attributes).forEach(attr => {
        if (!allowedAttributes.includes(attr.name.toLowerCase())) {
          node.removeAttribute(attr.name);
        }
      });
      
      // For links, ensure they don't have javascript: protocol
      if (node.tagName === 'A' && node.hasAttribute('href')) {
        const href = node.getAttribute('href');
        if (href.toLowerCase().startsWith('javascript:') || href.toLowerCase().startsWith('data:')) {
          node.removeAttribute('href');
        } else {
          // Add target="_blank" and rel="noopener noreferrer" for external links
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
      
      // Recursively clean child nodes
      Array.from(node.childNodes).forEach(cleanNode);
    }
  }
  
  Array.from(div.childNodes).forEach(cleanNode);
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
