/**
 * Google Calendar API Client
 * Fetches and displays upcoming events from Google Calendar
 */

// Use Netlify function to fetch calendar data (handles API key)
const CALENDAR_API_URL = '/.netlify/functions/calendar';

// The function returns up to 50 events so the next gig is found even when weekly
// sessions fill the next few months; the event list still shows this many.
const EVENT_LIST_LENGTH = 10;

// Times are shown in the venue's time zone, whatever the visitor's device says.
const TIME_ZONE = 'Europe/Dublin';

// The weekly session venue. Play-alongs held here are the routine Tuesday session.
const SESSION_VENUE_PATTERN = /stag/i;

// A cancelled week can be deleted from the calendar, or kept and renamed
// ("Cancelled", "No session") or tagged #cancelled. All of these count as off.
const CANCELLED_TITLE_PATTERN = /\b(cancell?ed|no session)\b/i;

/**
 * Determine event type from hashtags in the description or summary
 *
 * - #jam or #playalong → jam-session
 * - #concert → concert
 * - anything else → other (community group practices, etc.)
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
  
  // All-day events carry a bare date: format it as that date, not as midnight in Dublin
  options.timeZone = isAllDay ? 'UTC' : TIME_ZONE;

  let formatted = start.toLocaleDateString('en-IE', options);

  if (!isAllDay) {
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: TIME_ZONE
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
    
    // Keep events that have not finished yet: a session in progress still answers
    // "is it on?". The event list itself only shows events that have not started.
    const now = new Date();
    events = events.filter(event => eventEnd(event) > now);
    
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

function eventStart(event) {
  return new Date(event.start.dateTime || event.start.date);
}

/**
 * When an event ends. Events without an end are treated as ending when they start.
 */
function eventEnd(event) {
  const end = event.end && (event.end.dateTime || event.end.date);
  return end ? new Date(end) : eventStart(event);
}

function hasStarted(event, now) {
  return eventStart(event) <= now;
}

/**
 * The routine weekly session: a timed play-along at the session venue
 */
function isRoutineSession(event) {
  return Boolean(event.start.dateTime) &&
    getEventType(event) === 'jam-session' &&
    SESSION_VENUE_PATTERN.test(event.location || '') &&
    !isCancelled(event);
}

/**
 * An event kept in the calendar but marked as not happening
 */
function isCancelled(event) {
  return CANCELLED_TITLE_PATTERN.test(event.summary || '') ||
    (event.description || '').toLowerCase().includes('#cancelled');
}

/**
 * Calendar date of a moment in Dublin, as { year, month, day } plus a sortable YYYY-MM-DD key
 */
function dublinDate(date) {
  const parts = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(date)
    .forEach(part => { parts[part.type] = part.value; });
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    key: `${parts.year}-${parts.month}-${parts.day}`
  };
}

/**
 * The Tuesday the next session is expected on: today if it is Tuesday and the
 * session has not started yet, otherwise the next Tuesday.
 */
function expectedSessionTuesday(now) {
  const today = dublinDate(now);
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day);
  const weekday = new Date(todayUtc).getUTCDay(); // 0 = Sunday, 2 = Tuesday
  let offset = (2 - weekday + 7) % 7;
  if (offset === 0 && today.hour >= 20) {
    // Past 8pm on a Tuesday with no session in progress: tonight's is over (or was not on)
    offset = 7;
  }
  return new Date(todayUtc + offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * The next routine session and how to describe it:
 * 'now' (in progress), 'tonight', 'skipped' (none on the expected Tuesday) or 'upcoming'.
 * Returns null when the calendar has no upcoming routine session.
 */
function findNextSession(events, now) {
  const event = events.find(isRoutineSession);
  if (!event) {
    return null;
  }

  if (hasStarted(event, now)) {
    return { state: 'now', event };
  }

  const sessionDay = dublinDate(eventStart(event)).key;
  if (sessionDay === dublinDate(now).key) {
    return { state: 'tonight', event };
  }
  if (sessionDay > expectedSessionTuesday(now)) {
    return { state: 'skipped', event };
  }
  return { state: 'upcoming', event };
}

/**
 * The next concert that has not started yet and is not cancelled, or null
 */
function findNextGig(events, now) {
  return events.find(event => getEventType(event) === 'concert' && !isCancelled(event) && !hasStarted(event, now)) || null;
}

/**
 * "8pm", "10:30pm"
 */
function formatClockTime(date) {
  const parts = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(date)
    .forEach(part => { parts[part.type] = part.value; });
  const hour = Number(parts.hour);
  const suffix = hour < 12 ? 'am' : 'pm';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return parts.minute === '00' ? `${hour12}${suffix}` : `${hour12}:${parts.minute}${suffix}`;
}

/**
 * "Tuesday 6 October" (long) or "Tue 6 Oct" (short)
 */
function formatDay(date, style) {
  const options = style === 'long'
    ? { weekday: 'long', day: 'numeric', month: 'long' }
    : { weekday: 'short', day: 'numeric', month: 'short' };
  options.timeZone = TIME_ZONE;
  // Assemble the parts ourselves: browsers disagree on the punctuation ("Tue, 6 Oct")
  const parts = {};
  new Intl.DateTimeFormat('en-IE', options)
    .formatToParts(date)
    .forEach(part => { parts[part.type] = part.value; });
  return `${parts.weekday} ${parts.day} ${parts.month}`;
}

/**
 * Wording for the next-session card: a bold headline and a detail line.
 */
function describeNextSession(next) {
  const start = eventStart(next.event);
  const time = formatClockTime(start);
  const venue = 'Upstairs at The Stag\'s Head';

  switch (next.state) {
    case 'now': {
      const until = next.event.end && next.event.end.dateTime ? ` until ${formatClockTime(eventEnd(next.event))}` : '';
      return {
        headline: `On now${until}`,
        detail: `${venue} · Free · Come on up`
      };
    }
    case 'tonight':
      return {
        headline: `Tonight from ${time}`,
        detail: `${venue} · Free · All levels welcome`
      };
    case 'skipped':
      return {
        headline: 'No session this Tuesday',
        detail: `Next session: ${formatDay(start, 'long')}, ${time} · ${venue}`
      };
    default:
      return {
        headline: `Next session: ${formatDay(start, 'long')}, ${time}`,
        detail: `${venue} · Free · All levels welcome`
      };
  }
}

/**
 * Fill every [data-next-session] slot. Slots keep their built-in "every Tuesday"
 * text when the calendar has no upcoming session.
 */
function renderNextSession(events, now) {
  const next = findNextSession(events, now);
  if (!next) {
    return;
  }
  const text = describeNextSession(next);

  document.querySelectorAll('[data-next-session]').forEach(slot => fillNextEvent(slot, text));
}

/**
 * Write a headline and a detail line into a next-event box
 */
function fillNextEvent(slot, text) {
  const headline = slot.querySelector('.next-event-headline');
  const detail = slot.querySelector('.next-event-detail');
  if (headline) headline.textContent = text.headline;
  if (detail) detail.textContent = text.detail;
}

/**
 * Wording for the next-gig box, in the same shape as the next-session card:
 * the date and time as the headline, what and where as the detail line.
 */
function describeNextGig(gig, now) {
  const start = eventStart(gig);
  const time = gig.start.dateTime ? formatClockTime(start) : '';
  const isToday = dublinDate(start).key === dublinDate(now).key;
  const day = isToday ? 'today' : formatDay(start, 'long');

  const title = (gig.summary || '').trim();
  const place = (gig.location || '').split(',')[0].trim();
  const details = [];
  if (title) details.push(title);
  if (place && place.toLowerCase() !== title.toLowerCase()) details.push(place);

  return {
    headline: `Next gig: ${day}${time ? `, ${time}` : ''}`,
    detail: details.join(' · ')
  };
}

/**
 * Fill and reveal every [data-next-gig] slot; they stay hidden when no gig is announced.
 */
function renderNextGig(events, now) {
  const gig = findNextGig(events, now);
  if (!gig) {
    return;
  }

  const text = describeNextGig(gig, now);

  document.querySelectorAll('[data-next-gig]').forEach(slot => {
    fillNextEvent(slot, text);
    slot.hidden = false;
  });
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
    const toggleIndicator = event.description ? `<span class="toggle-indicator" aria-hidden="true">▸</span>` : '';
    
    return `
      <div class="calendar-event ${eventType}" data-event-index="${index}" ${description ? 'role="button" tabindex="0" aria-expanded="false" aria-controls="event-desc-' + index + '"' : ''}>
        <div class="event-date">${dateStr}</div>
        <div class="event-title-wrapper">
          ${toggleIndicator}
          <div class="event-title">${escapeHtml(event.summary || 'Untitled Event')}</div>
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
            if (toggleIndicator) toggleIndicator.textContent = '▸';
          } else {
            descriptionElement.classList.remove('event-description--hidden');
            eventElement.setAttribute('aria-expanded', 'true');
            if (toggleIndicator) toggleIndicator.textContent = '▾';
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
      
      // For links, ensure they don't have dangerous protocols
      if (node.tagName === 'A' && node.hasAttribute('href')) {
        const href = node.getAttribute('href').toLowerCase();
        const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
        
        // Check if href starts with any dangerous protocol
        if (dangerousProtocols.some(protocol => href.startsWith(protocol))) {
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
 * Convert calendar HTML to plain text and drop the #hashtags used for classification
 */
function toPlainText(html) {
  const text = new DOMParser().parseFromString(html || '', 'text/html').body.textContent || '';
  return text.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Build a schema.org Event for a play-along or concert, or null if it doesn't qualify
 * See https://developers.google.com/search/docs/appearance/structured-data/event
 */
function buildEventNode(event, organization, venue, image) {
  const eventType = getEventType(event);
  if (eventType === 'other' || !event.location) {
    return null;
  }

  const node = {
    '@type': 'Event',
    name: event.summary || 'Untitled Event',
    startDate: event.start.dateTime || event.start.date,
    eventStatus: isCancelled(event) ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
  };

  if (event.end && (event.end.dateTime || event.end.date)) {
    node.endDate = event.end.dateTime || event.end.date;
  }

  const description = toPlainText(event.description);
  if (description) {
    node.description = description;
  }

  if (venue && SESSION_VENUE_PATTERN.test(event.location)) {
    // The weekly session venue: use its full address and mark the session free
    node.location = venue;
    node.isAccessibleForFree = true;
    node.offers = {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${organization.url.replace(/\/$/, '')}/tuesday-session/`
    };
  } else {
    node.location = {
      '@type': 'Place',
      name: event.location.split(',')[0].trim(),
      address: event.location
    };
  }

  const organizer = { '@type': 'Organization', '@id': organization['@id'], name: organization.name, url: organization.url };
  node.organizer = organizer;
  node.performer = organizer;

  if (image) {
    node.image = [image];
  }

  return node;
}

/**
 * Add the upcoming play-alongs and concerts to the page's JSON-LD graph so search
 * engines can show them. Only pages that declare the session venue get Events.
 */
function addEventsToStructuredData(events) {
  const script = document.querySelector('script[type="application/ld+json"]');
  if (!script) {
    return;
  }

  try {
    const data = JSON.parse(script.textContent);
    const graph = data['@graph'] || [];
    const organization = graph.find(node => (node['@id'] || '').endsWith('/#organization'));
    const venue = graph.find(node => (node['@id'] || '').endsWith('/#stags-head'));
    if (!organization || !venue) {
      return;
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    const image = ogImage && ogImage.content ? new URL(ogImage.content, organization.url).href : null;

    const eventNodes = events
      .map(event => buildEventNode(event, organization, venue, image))
      .filter(Boolean);
    if (eventNodes.length === 0) {
      return;
    }

    data['@graph'] = graph.concat(eventNodes);
    script.textContent = JSON.stringify(data);
  } catch (error) {
    console.warn('Could not add events to structured data:', error);
  }
}

/**
 * Initialize the calendar: the event list when the page has one, the next-session
 * and next-gig lines wherever they appear, and the structured data.
 */
async function initCalendar(containerId) {
  const container = document.getElementById(containerId);

  // Show loading state
  if (container) {
    container.innerHTML = '<p class="loading-events">Loading upcoming events...</p>';
  }

  try {
    const events = await fetchCalendarEvents();
    const now = new Date();
    const notStarted = events.filter(event => !hasStarted(event, now));

    if (container) {
      renderEvents(notStarted.slice(0, EVENT_LIST_LENGTH), containerId);
    }
    renderNextSession(events, now);
    renderNextGig(events, now);
    addEventsToStructuredData(notStarted);
  } catch (error) {
    if (container) {
      container.innerHTML = '<p class="error-events">Unable to load events. Please try again later.</p>';
    }
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
