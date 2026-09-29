import { test, expect, Page } from '@playwright/test';

/**
 * The "next session" lines (hero pill, Play Along card, Tuesday Session card) and the
 * "next gig" line in See Us Live, filled from the Events Calendar (issue #187).
 *
 * The clock is frozen on dates in late September 2026, when Dublin is on UTC+1:
 * a session from 20:00 to 22:30 in Dublin is 19:00 to 21:30 UTC.
 */

const STAGS_HEAD = "The Stag's Head, 1 Dame Ct, Dublin, D02 TW84, Ireland";

function session(date: string) {
  return {
    summary: 'Ukulele Tuesday Session',
    description: '#playalong',
    location: STAGS_HEAD,
    start: { dateTime: `${date}T19:00:00Z` },
    end: { dateTime: `${date}T21:30:00Z` },
  };
}

const gig = {
  summary: 'Ukulele Hooley',
  description: 'Main stage. #concert',
  location: 'Dún Laoghaire, Co. Dublin',
  start: { dateTime: '2026-11-14T15:00:00Z' },
};

const festivalPlayAlong = {
  summary: 'Festival Play-Along',
  description: '#jam',
  location: 'Festival Field, Stradbally',
  start: { dateTime: '2026-10-03T13:00:00Z' },
};

const TUESDAYS = ['2026-09-29', '2026-10-06', '2026-10-13', '2026-10-20'];

async function openAt(page: Page, path: string, now: string, items: object[]) {
  await page.clock.setFixedTime(new Date(now));
  await page.route('**/.netlify/functions/calendar', (route) => route.fulfill({ json: { items } }));
  await page.goto(path);
}

const pill = (page: Page) => page.locator('.next-session-pill');
const card = (page: Page) => page.locator('#play-along .next-session');

test.describe('Next session on the homepage', () => {
  test('on a Tuesday morning it says tonight', async ({ page }) => {
    await openAt(page, '/', '2026-09-29T09:00:00Z', TUESDAYS.map(session));
    await expect(pill(page)).toHaveText("Tonight from 8pm · The Stag's Head");
    await expect(card(page).locator('.next-session-headline')).toHaveText('Tonight from 8pm');
    await expect(card(page).locator('.next-session-detail')).toHaveText(
      "Upstairs at The Stag's Head · Free · All levels welcome",
    );
  });

  test('during the session it says it is on now', async ({ page }) => {
    await openAt(page, '/', '2026-09-29T20:00:00Z', TUESDAYS.map(session));
    await expect(pill(page)).toHaveText("On now until 10:30pm · The Stag's Head");
    await expect(card(page).locator('.next-session-headline')).toHaveText('On now until 10:30pm');
  });

  test('after the session it gives next week, not "no session"', async ({ page }) => {
    await openAt(page, '/', '2026-09-29T22:00:00Z', TUESDAYS.slice(1).map(session));
    await expect(pill(page)).toHaveText('Next session: Tue 6 Oct, 8pm');
    await expect(card(page).locator('.next-session-headline')).toHaveText('Next session: Tuesday 6 October, 8pm');
  });

  test('later in the week it gives the coming Tuesday', async ({ page }) => {
    await openAt(page, '/', '2026-09-30T11:00:00Z', [festivalPlayAlong, ...TUESDAYS.slice(1).map(session)]);
    await expect(pill(page)).toHaveText('Next session: Tue 6 Oct, 8pm');
    await expect(card(page).locator('.next-session-headline')).toHaveText('Next session: Tuesday 6 October, 8pm');
  });

  test('a Tuesday with no session in the calendar is called out', async ({ page }) => {
    await openAt(page, '/', '2026-09-30T11:00:00Z', TUESDAYS.slice(2).map(session));
    await expect(pill(page)).toHaveText('No session this Tuesday · Next: Tue 13 Oct');
    await expect(card(page).locator('.next-session-headline')).toHaveText('No session this Tuesday');
    await expect(card(page).locator('.next-session-detail')).toHaveText(
      "Next session: Tuesday 13 October, 8pm · Upstairs at The Stag's Head",
    );
  });

  test('keeps the built-in wording when the calendar fails', async ({ page }) => {
    await page.route('**/.netlify/functions/calendar', (route) => route.fulfill({ status: 500, json: {} }));
    await page.goto('/');
    await expect(page.locator('.error-events')).toBeVisible();
    await expect(pill(page)).toHaveText("Every Tuesday from 8pm · The Stag's Head");
    await expect(card(page).locator('.next-session-headline')).toHaveText('Every Tuesday from 8pm');
    await expect(page.locator('.next-gig')).toBeHidden();
  });

  test('the pill links to the Play Along section', async ({ page }) => {
    await openAt(page, '/', '2026-09-30T11:00:00Z', TUESDAYS.slice(1).map(session));
    await expect(pill(page)).toHaveAttribute('href', '#play-along');
    await expect(page.locator('#play-along h2')).toHaveText('Play Along With Us');
  });
});

test.describe('A week kept in the calendar but marked as cancelled', () => {
  const renamed = (date: string, summary: string) => ({ ...session(date), summary });

  test('a session renamed "Cancelled" reads as no session that week', async ({ page }) => {
    await openAt(page, '/', '2026-09-30T11:00:00Z', [
      renamed('2026-10-06', 'CANCELLED: Ukulele Tuesday Session'),
      ...TUESDAYS.slice(2).map(session),
    ]);
    await expect(pill(page)).toHaveText('No session this Tuesday · Next: Tue 13 Oct');
    await expect(card(page).locator('.next-session-headline')).toHaveText('No session this Tuesday');
  });

  test('"No session" in the title on the day itself', async ({ page }) => {
    await openAt(page, '/', '2026-09-29T09:00:00Z', [
      renamed('2026-09-29', 'No session (bank holiday)'),
      ...TUESDAYS.slice(1).map(session),
    ]);
    await expect(pill(page)).toHaveText('No session this Tuesday · Next: Tue 6 Oct');
  });

  test('a #cancelled tag in the description works too', async ({ page }) => {
    await openAt(page, '/', '2026-09-30T11:00:00Z', [
      { ...session('2026-10-06'), description: '#playalong #cancelled' },
      ...TUESDAYS.slice(2).map(session),
    ]);
    await expect(pill(page)).toHaveText('No session this Tuesday · Next: Tue 13 Oct');
  });

  test('a cancelled gig is skipped for the next one', async ({ page }) => {
    await openAt(page, '/', '2026-09-30T11:00:00Z', [
      ...TUESDAYS.slice(1).map(session),
      { ...gig, summary: 'Harvest Fair (cancelled)', start: { dateTime: '2026-10-24T15:00:00Z' } },
      gig,
    ]);
    await expect(page.locator('.next-gig')).toHaveText('Next gig: Sat 14 Nov · Ukulele Hooley · Dún Laoghaire');
  });

  test('structured data marks the cancelled session as cancelled', async ({ page }) => {
    await openAt(page, '/', '2026-09-30T11:00:00Z', [
      renamed('2026-10-06', 'CANCELLED: Ukulele Tuesday Session'),
      ...TUESDAYS.slice(2).map(session),
    ]);
    await expect(pill(page)).toHaveText('No session this Tuesday · Next: Tue 13 Oct');
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const events = JSON.parse(raw!)['@graph'].filter((node: any) => node['@type'] === 'Event');
    expect(events[0].eventStatus).toBe('https://schema.org/EventCancelled');
    expect(events[1].eventStatus).toBe('https://schema.org/EventScheduled');
  });
});

test.describe('Next gig on the homepage', () => {
  test('shows the next concert in See Us Live', async ({ page }) => {
    await openAt(page, '/', '2026-09-30T11:00:00Z', [...TUESDAYS.slice(1).map(session), gig]);
    const line = page.locator('.next-gig');
    await expect(line).toBeVisible();
    await expect(line).toHaveText('Next gig: Sat 14 Nov · Ukulele Hooley · Dún Laoghaire');
  });

  test('stays hidden when no concert is announced', async ({ page }) => {
    await openAt(page, '/', '2026-09-30T11:00:00Z', [festivalPlayAlong, ...TUESDAYS.slice(1).map(session)]);
    await expect(pill(page)).toHaveText('Next session: Tue 6 Oct, 8pm');
    await expect(page.locator('.next-gig')).toBeHidden();
  });

  test('the event list still shows the first ten upcoming events', async ({ page }) => {
    const weekly = Array.from({ length: 20 }, (_, week) =>
      session(new Date(Date.UTC(2026, 9, 6 + week * 7)).toISOString().slice(0, 10)),
    );
    await openAt(page, '/', '2026-09-30T11:00:00Z', [...weekly, gig]);
    await expect(page.locator('#upcoming-events')).toHaveText('All Upcoming Events');
    await expect(page.locator('#upcoming-events-list .calendar-event')).toHaveCount(10);
    // The gig is beyond the list's ten events but still reaches See Us Live
    await expect(page.locator('.next-gig')).toBeVisible();
  });
});

test('the Tuesday Session page shows the next session', async ({ page }) => {
  await openAt(page, '/tuesday-session/', '2026-09-30T11:00:00Z', TUESDAYS.slice(1).map(session));
  await expect(page.locator('#next-session .next-session-headline')).toHaveText(
    'Next session: Tuesday 6 October, 8pm',
  );
  await expect(page.locator('a[href="#next-session"]')).toHaveCount(1);
});
