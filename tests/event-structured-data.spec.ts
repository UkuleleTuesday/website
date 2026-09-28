import { test, expect, Page } from '@playwright/test';

/**
 * Upcoming play-alongs and concerts from the Events Calendar are added to the
 * page's JSON-LD as schema.org Events (issue #186), on the home and Tuesday
 * Session pages only.
 */

const DAY = 24 * 60 * 60 * 1000;
const inDays = (days: number) => new Date(Date.now() + days * DAY).toISOString();

const stagsHeadStart = inDays(7);
const stagsHeadEnd = new Date(Date.parse(stagsHeadStart) + 2.5 * 60 * 60 * 1000).toISOString();
const otherPlayAlongStart = inDays(10);
const concertStart = inDays(14);

const calendarItems = [
  {
    summary: 'Ukulele Tuesday Play-Along',
    description: 'Bring your uke and <strong>sing along</strong>!\n#jam',
    location: "The Stag's Head, 1 Dame Ct, Dublin 2, D02 TW84, Ireland",
    start: { dateTime: stagsHeadStart },
    end: { dateTime: stagsHeadEnd },
  },
  {
    summary: 'Festival Play-Along',
    description: '#playalong',
    location: 'Festival Field, Stradbally, Co. Laois',
    start: { dateTime: otherPlayAlongStart },
  },
  {
    summary: 'Ukulele Tuesday at the Summer Fair',
    description: 'The band plays the main stage. #concert',
    location: 'Merrion Square, Dublin 2',
    start: { dateTime: concertStart },
  },
  {
    summary: 'Community group practice',
    location: 'Somewhere, Dublin',
    start: { dateTime: inDays(15) },
  },
  {
    summary: 'Concert with no venue yet',
    description: '#concert',
    start: { dateTime: inDays(20) },
  },
];

async function mockCalendar(page: Page) {
  await page.route('**/.netlify/functions/calendar', (route) =>
    route.fulfill({ json: { items: calendarItems } }),
  );
}

async function readGraph(page: Page): Promise<any[]> {
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  return JSON.parse(raw!)['@graph'];
}

async function waitForEvents(page: Page): Promise<any[]> {
  await expect
    .poll(async () => (await readGraph(page)).filter((node) => node['@type'] === 'Event').length)
    .toBeGreaterThan(0);
  return readGraph(page);
}

for (const path of ['/', '/tuesday-session/']) {
  test.describe(`Event structured data on ${path}`, () => {
    let graph: any[];
    let events: any[];

    test.beforeEach(async ({ page }) => {
      await mockCalendar(page);
      await page.goto(path);
      graph = await waitForEvents(page);
      events = graph.filter((node) => node['@type'] === 'Event');
    });

    test('keeps a single JSON-LD script', async ({ page }) => {
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    });

    test('adds play-alongs and concerts that have a location, and nothing else', () => {
      expect(events.map((event) => event.name)).toEqual([
        'Ukulele Tuesday Play-Along',
        'Festival Play-Along',
        'Ukulele Tuesday at the Summer Fair',
      ]);
      expect(events.map((event) => event.startDate)).toEqual([stagsHeadStart, otherPlayAlongStart, concertStart]);
    });

    test('describes the Stag\'s Head session as free, with the full address', () => {
      const session = events[0];
      expect(session.endDate).toBe(stagsHeadEnd);
      expect(session.location.name).toBe("The Stag's Head");
      expect(session.location.address).toMatchObject({
        '@type': 'PostalAddress',
        streetAddress: '1 Dame Court',
        postalCode: 'D02 TW84',
        addressCountry: 'IE',
      });
      expect(session.location.geo).toMatchObject({ '@type': 'GeoCoordinates' });
      expect(session.isAccessibleForFree).toBe(true);
      expect(session.offers).toMatchObject({ '@type': 'Offer', price: 0, priceCurrency: 'EUR' });
    });

    test('uses the calendar location for events elsewhere, without claiming they are free', () => {
      const [, playAlong, concert] = events;
      expect(playAlong.location).toEqual({
        '@type': 'Place',
        name: 'Festival Field',
        address: 'Festival Field, Stradbally, Co. Laois',
      });
      expect(playAlong.isAccessibleForFree).toBeUndefined();
      expect(playAlong.offers).toBeUndefined();
      expect(concert.location.address).toBe('Merrion Square, Dublin 2');
    });

    test('writes plain-text descriptions without hashtags', () => {
      expect(events[0].description).toBe('Bring your uke and sing along!');
      expect(events[1].description).toBeUndefined();
      expect(events[2].description).toBe('The band plays the main stage.');
    });

    test('points organizer and performer at the Organization, with an image', () => {
      const organization = graph.find((node) => node['@type'] === 'Organization');
      for (const event of events) {
        expect(event.organizer['@id']).toBe(organization['@id']);
        expect(event.performer['@id']).toBe(organization['@id']);
        expect(event.eventStatus).toBe('https://schema.org/EventScheduled');
        expect(event.image[0]).toMatch(/^https?:\/\//);
      }
    });
  });
}

test('pages without the session venue get no Events', async ({ page }) => {
  await mockCalendar(page);
  await page.goto('/songbook/', { waitUntil: 'networkidle' });
  const graph = await readGraph(page);
  expect(graph.filter((node) => node['@type'] === 'Event')).toEqual([]);
  expect(graph.filter((node) => node['@type'] === 'Place')).toEqual([]);
});
