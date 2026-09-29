# Visitor Search Insights Spike

**Date:** 2026-09-28  
**Context:** Follow-up to the Search Console exports added under
`docs/spikes/data/2026-09-top-tasks/search-console/`. This note pulls out the visitor-level patterns
that seem most useful for product, content and navigation decisions.

---

## TL;DR

The search data points to four distinct audiences:

1. **People who already know Ukulele Tuesday and want a quick answer.** Brand searches dominate and
   spike hard on Tuesdays, which is strong evidence that many visitors arrive asking "is it on
   tonight, where is it, what time does it start?"
2. **People in Dublin looking for a ukulele group to join.** Discovery queries have meaningful
   volume and decent rankings, but weak click-through, which suggests the site is being shown for
   the right searches without promising the answer clearly enough.
3. **A global songbook audience.** The songbook attracts a large non-Irish audience and a lot of
   impressions from generic searches, making it both a top task and the site's main international
   reach channel.
4. **Small but valuable commercial and learning audiences.** Booking, workshop and lessons demand is
   visible in impressions even though the site currently converts very little of it.

None of this says what people do after arriving. Search Console shows acquisition, not task
completion.

---

## Sources and limits

- Twelve-month export: 2025-09-25 to 2026-09-24
- Three-month export: 2026-06-25 to 2026-09-24
- Source files: `docs/spikes/data/2026-09-top-tasks/search-console/last-12-months/` and
  `last-3-months/`
- Related synthesis: `docs/spikes/2026-09-27-top-tasks-review.md`

Important limits:

- Google web search only; no direct, WhatsApp, social, Maps or Tripadvisor traffic
- Rare queries omitted by Google, so the visible query list covers only about half of clicks
- Search Console shows searches and landings, not cross-page journeys or success on site

---

## What the visitor mix looks like

### 1. The site mostly serves known-name visitors

The top three queries are all brand-led:

- `ukulele tuesday`: 723 clicks
- `ukulele tuesday songbook`: 345 clicks
- `ukulele tuesday dublin`: 242 clicks

That points to a large audience who already know the group exists and are using Google as a
shortcut. The weekday pattern strengthens that reading: over twelve months the site averages 17.6
clicks on Tuesdays versus 7.2 on other days, and the same pattern holds in the most recent
three-month window. Searchers are likely trying to confirm whether the session is happening, where
it is, and how to get the songbook quickly.

**Useful implication:** the homepage and search snippets should answer the Tuesday question faster
than they do today.

### 2. Discovery demand exists beyond the brand

There is consistent non-brand demand from people trying to find a ukulele group:

- `ukulele dublin`: 980 impressions, 71 clicks
- `ukulele groups near me`: 237 impressions, 16 clicks
- `tuesday ukulele group`: 131 impressions, 17 clicks
- `ukulele group dublin`: 143 impressions, 6 clicks
- `ukulele groups near me for adults`: 31 impressions, 3 clicks

There is also missed demand:

- `ukulele ireland`: 840 impressions, 0 clicks
- `uke ireland`: 535 impressions, 0 clicks

The site is already being shown for these searches, often on page one, but not winning enough
clicks. That usually means the title, H1 and meta description are weaker than the ranking.

**Useful implication:** discovery is the clearest growth audience in the data, and it looks like a
copy-and-positioning problem more than a ranking problem.

### 3. The songbook is both a core task and an acquisition channel

The songbook is not only a tool for regulars; it is one of the site's main reasons for being found:

- `/songbook/`: 855 clicks, 16,034 impressions
- `songbooks.ukuleletuesday.ie/`: 173 clicks, 3,395 impressions
- `ukulele songbook`: 1,453 impressions
- Generic songbook, songs and chords queries together contribute roughly 4,100 impressions

The geography backs this up. Ireland accounts for 65% of clicks, leaving 35% outside Ireland, and
the strongest international fit in the data is generic songbook searching rather than local session
intent.

The recent window suggests Google is beginning to prefer the songbook subdomain for generic
songbook searches:

- main-site `/songbook/`: 70 clicks per 30 days over twelve months, 72 in the last three months
- songbook subdomain: 14 clicks per 30 days over twelve months, 21 in the last three months

**Useful implication:** the site has a local community audience and an international utility
audience; the songbook should deliberately hand some of that reach back to the main site.

### 4. Phones are the default audience

Device split over twelve months:

- Mobile: 2,062 clicks, 19,720 impressions, 10.46% CTR
- Desktop: 900 clicks, 17,059 impressions, 5.28% CTR
- Tablet: 189 clicks, 1,402 impressions, 13.48% CTR

Roughly two thirds of clicks come from phones. Desktop still drives plenty of impressions, but at a
far lower click-through rate, which fits the generic songbook audience: lots of search exposure,
less urgent local intent.

**Useful implication:** the audience that acts is mainly on phones, especially for the weekly
session and songbook paths.

### 5. Booking demand is small in clicks and large in missed opportunity

Commercial queries barely click through, but they do exist:

- `ukulele bands ireland`: 698 impressions, 1 click
- `ukulele band ireland`: 129 impressions, 0 clicks
- `ukulele wedding band`: 90 impressions, 0 clicks
- `ukulele wedding band ireland`: 87 impressions, 0 clicks

This is exactly the kind of audience that search volume understates: rare visits, high value. The
site is already being shown for these searches, which means search engines think it might be
relevant, but the snippet and landing page are not closing the deal.

**Useful implication:** "Book us" is not a traffic play; it is a yield play.

### 6. Lessons and workshops look like a real adjacent need

Learning queries are not huge, but they are persistent and recently stronger:

- `ukulele lessons dublin`: 382 impressions over twelve months, 147 in the last three months
- `ukulele classes near me`: 129 impressions
- `ukulele classes dublin`: 60 impressions
- Long-tail variants include "for adults" and "for beginners"

This suggests some searchers do not yet understand that the Tuesday session is beginner-friendly,
and some may be looking for exactly the workshop-style offer the group can plausibly provide.

**Useful implication:** beginner reassurance is not just nice-to-have copy; it has search demand
behind it.

### 7. Some internal priorities have almost no search demand

Search is not bringing people for support, governance or community details:

- `/support-us`: 161 impressions, 0 clicks
- `/contact-us/`: 1,316 impressions, 2 clicks
- `/testimonials/`: 749 impressions, 2 clicks
- WhatsApp and Code of Conduct appear only lightly in the page table and barely at all in queries

That does not make those tasks unimportant. It does mean they are mostly **on-site** tasks or tasks
driven by other channels, not organic search entry points.

**Useful implication:** these pages should be designed to help visitors who are already here, not as
major search landing pages.

---

## What changed in the last three months

The short window mostly confirms the annual picture rather than overturning it:

- overall clicks are slightly up
- the Tuesday spike is unchanged
- Ireland remains 65% of clicks
- phones remain about two thirds of clicks

The main meaningful movements are:

1. **The songbook subdomain is gaining ground.** Google seems increasingly willing to send generic
   songbook searchers straight there.
2. **Lessons demand looks warmer right now.** `ukulele lessons dublin` delivered more than a third
   of its annual impressions in one quarter.
3. **Wedding-band demand is seasonal.** It is weaker in the recent summer window, so annual numbers
   are the better guide for that audience.
4. **`/faq/` has effectively disappeared from search.** That lowers its urgency as a search problem.

---

## Visitor-level conclusions worth carrying forward

1. **There is not one visitor.** The data shows at least four: local regulars/attendees,
   first-timers discovering a group, international songbook seekers, and organisers.
2. **Brand search is probably standing in for operational questions.** The Tuesday spike matters more
   than the literal wording of the queries.
3. **The best growth opportunity is discovery copy, not just more content.** Search engines already
   rank the site for useful non-brand queries.
4. **The songbook is both the strongest service to existing members and the main top-of-funnel asset
   for the wider web.**
5. **Commercial intent is under-measured if we look only at clicks.** Organiser traffic is sparse
   but clearly present.
6. **Organic search is a poor proxy for community tasks like WhatsApp, support and conduct.** Those
   need on-site or channel-specific measurement.

---

## Questions this data still cannot answer

- Of the brand visitors, how many want the songbook versus session details versus something else?
- Do discovery visitors become attendees?
- Do organiser visitors submit the form?
- Do songbook visitors ever return to the main site?
- How much demand comes from channels search cannot see, especially WhatsApp, social and direct?

Those are measurement gaps, not search-data gaps.
