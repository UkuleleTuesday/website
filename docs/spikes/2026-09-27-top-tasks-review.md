# Top-Tasks Review: Does the Site Start From What Visitors Came To Do?

**Date:** 2026-09-27
**Context:** Follow-up to the review of the Press page ([#174](https://github.com/UkuleleTuesday/website/issues/174)),
which found a page organised around content we happened to have rather than a task a visitor
actually has. This spike asks whether that pattern holds across the whole site, and what a
task-first structure would look like.
**Scope:** Every rendered page, the shared header and footer, structured data, sitemap, and the
analytics setup. Performance and accessibility are covered by the March 2026 spikes and are only
referenced here where they touch a task.
**Not done:** No user research exists yet. The task ranking in this document is a hypothesis built
from the site's own evidence, and section 7 describes the cheap poll that would confirm or
overturn it. Live analytics were not available to this review; the Mixpanel figures quoted by the
team (very low traffic to `/testimonials/`) are taken on trust.

---

## TL;DR

The site is organised by *content type* (Concerts, Session, Songbook, Press, Support Us) rather
than by *what visitors come to do*. Because the site is small this mostly works, but the seams show
in six places:

1. **The homepage does not answer the most common question above the fold.** "Is it on this
   Tuesday, what time, where, is it free?" first appears in the third block of body copy, and the
   calendar that actually answers "this week" is the last thing before the footer.
2. **Navigation is the old WordPress page list.** It spends a slot on Press, none on Contact or
   About, labels the booking page "Concerts", and sends "Support Us" off-site in a new tab.
3. **Three pages are orphans in practice.** WhatsApp is reachable only through an icon, the Code of
   Conduct only from the WhatsApp page, and Contact has no context beyond a bare form.
4. **The footer does no navigation work** and the copyright still says 2022.
5. **Crawl hygiene advertises a dead page.** The sitemap lists `/faq/`, which was merged into the
   Session page in [#108](https://github.com/UkuleleTuesday/website/pull/108) with no redirect,
   plus image paths and stylesheet paths from the removed WordPress install.
6. **We cannot measure task success.** Mixpanel runs with persistence disabled, so every page load
   is a new anonymous visitor; there are no journeys, funnels, or task-completion counts.

**Recommendation:** adopt a short list of top tasks as the organising principle, confirm the
ranking with a two-week one-question poll, restructure the homepage, navigation and footer around
the confirmed top tasks, and fix measurement so each top task has a success metric. A phased
roadmap with effort estimates is in section 8, and section 9 restates it as GTD projects and next
actions.

---

## 1. Method

### Top tasks in one paragraph

Gerry McGovern's Top Tasks method (used by the BBC, Cisco, the EU, and many public bodies) rests on
one repeated observation: on any site, a handful of tasks account for most of what most visitors
want, and a long tail of tasks accounts for very little. The method is: build a longlist of
everything a visitor might want; shorten it; ask real visitors to pick what matters most to them;
design navigation and the homepage around the winners; then measure how quickly and reliably
people complete those tasks. Everything else (including content the organisation cares about) is
allowed to exist but must not compete with the top tasks for attention.

The practical corollaries used throughout this review:

- A page or a nav item earns its place by serving a frequent or high-value task, not by the
  existence of content.
- Labels are written in the visitor's words, not the organisation's.
- Supporting content (proof, FAQs, policies) lives next to the decision it supports.
- Success is measured as task completion, not page views.

### Evidence used

| Source | What it gave us |
|---|---|
| `templates/` and the internal link graph | What each page says, what it links to, what links to it |
| Visual-regression baselines (`tests/snapshots.spec.ts-snapshots/`, taken 2026-03-22) | Above-the-fold and scroll depth on phone and desktop. Note: [#172](https://github.com/UkuleleTuesday/website/pull/172) reordered images on phones after this; section order is unchanged |
| Open GitHub issues | Known gaps already spotted by the team (referenced inline) |
| Exec priorities from the July 2026 AGM prep notes | More jam sessions, accessibility, first-timers who come back, more volunteers, money raised |
| What search engines surface for obvious queries | Which audiences arrive from outside, and which competing pages answer them |
| `static/js/mixpanel.js`, `build.py`, Netlify config | What the analytics can and cannot tell us |

---

## 2. Who comes to the site, and what they are trying to do

| Audience | Situation | Typical task | Usually arrives from |
|---|---|---|---|
| **First-timer (local)** | Heard about it, deciding whether to come | What is it, is it for me as a beginner, when, where, is it free, can I borrow a uke | Google, Instagram, word of mouth |
| **Tourist** | In Dublin on a Tuesday | Is it on tonight, where exactly, what time, is it free | Tripadvisor, Google Maps, the Stag's Head site |
| **Regular** | Before or during a session | Open the songbook, check it is on this week (bank holidays, festivals), theme nights, WhatsApp | Direct, bookmark, WhatsApp |
| **Event or festival organiser** | Planning a programme | What do you offer, what does it look and sound like, past gigs, availability, fee basis, how to book | Google, referrals from other festivals |
| **Journalist or blogger** | Writing a piece | Boilerplate, facts, photos, a contact | Google |
| **Supporter** | At a session (QR code) or afterwards | Donate in two taps; know what the money funds | QR codes, nav |
| **Community member** | Wants the chat, wants to sell a uke | Join WhatsApp, read the Code of Conduct | Session, socials |
| **Prospective volunteer** | Wants to help run it | How do I get involved | Nothing on the site today |

The exec priorities map cleanly onto these audiences: "first-timers come back" is the first-timer
and tourist; "more volunteers" is the prospective volunteer; "money raised" is the supporter and
the organiser; "accessibility" cuts across the first three.

---

## 3. Task longlist and hypothesised ranking

Fifteen candidate tasks, ordered by the evidence available today. The order is a hypothesis; the
poll in section 7 is how it gets confirmed.

| # | Task (in the visitor's words) | Evidence for its rank |
|---|---|---|
| T1 | **Is the session on this Tuesday? What time, where, is it free?** | First FAQ on the Session page; repeated in the footer; the Tripadvisor listing and the Stag's Head event page exist for exactly this question; needed by every audience except organisers |
| T2 | **Open the songbook** | First hero button; nav item; linked three times from the Session page; used every week by regulars and by the 100+ WhatsApp members |
| T3 | **What is this, and can I join as a beginner or without a ukulele?** | Nine-question FAQ exists to answer it; "first-timers come back" is an exec priority |
| T4 | **Book the group for an event** | "Book Us!" on every page; a form on two pages; the Concerts copy is a pitch. Fewer people, highest value per visit |
| T5 | **Support us / donate** | Nav item; two QR redirect routes; tips paragraph in the FAQ; "money raised" is an exec priority |
| T6 | **Join the WhatsApp community** | Gate page exists; "Join 100+ members" |
| T7 | **Watch or listen to the group** | Videos, Spotify and YouTube on Concerts; socials everywhere |
| T8 | **See which gigs I can come to as an audience member** | Calendar classifies `#concert` events; no list on the Concerts page |
| T9 | **Contact you about something else** (accessibility, borrowing a uke, lost property) | Contact page exists; FAQ says "let us know" without a link |
| T10 | **Read the Code of Conduct** | Required to join WhatsApp; a safety promise the site makes |
| T11 | **Learn about the community group** | Absent from the site ([#93](https://github.com/UkuleleTuesday/website/issues/93)) |
| T12 | **Get involved as a volunteer** | Absent from the site; exec priority |
| T13 | **Get press assets** | Absent ([#174](https://github.com/UkuleleTuesday/website/issues/174)) |
| T14 | **Understand how the club is run** (governance, constitution) | Absent ([#94](https://github.com/UkuleleTuesday/website/issues/94)) |
| T15 | **Buy merch** | Not offered yet |

If the top-tasks pattern holds, T1 to T5 will collect well over half the votes and T1 to T3 will
dominate on phones.

---

## 4. How the site serves each task today

### 4.1 Task by task

**T1: Is it on this Tuesday, when, where, free?**
Served, but buried. The homepage H1 is "Welcome to Ukulele Tuesday", which carries no information,
and the two hero buttons are "View Songbook" and "Get In touch". The first mention of Tuesday, 8pm,
the Stag's Head and free entry is a body paragraph in the third block. The calendar, which is the
only thing that answers "this week" (bank holidays, festival weeks), is the final block before the
footer: about four screens down on the phone baseline. The Session page's own answer to "Are you
on this Tuesday?" is "yes, every Tuesday" followed by a link back to the homepage calendar. Nothing
anywhere says "Next session: Tuesday 30 September". The footer does carry the time and address,
which is the one place the answer is consistent on every page. There is no Event structured data,
so search engines get no help either.

**T2: Open the songbook.**
Strong: hero button, nav item, dedicated page, three links from the Session page. Friction: the
task takes two hops (site, then the `/songbook/` page, then the songbooks subdomain in a new tab),
and the subdomain has no way back ([#69](https://github.com/UkuleleTuesday/website/issues/69)).
The `/songbook/` page front-loads a slogan and a paragraph before the button. For someone on a
phone in a noisy pub, one tap fewer matters.

**T3: What is it, can I join as a beginner?**
The Session page does this well: 823 words, a clear intro, honest accessibility information
(narrow stairs, no lift), house ukes, requests welcome, 18-and-over. The gaps are in getting there
and in emphasis: the homepage offers one paragraph and a "Read More →" button that does not say
where it goes ([#159](https://github.com/UkuleleTuesday/website/issues/159)); there is no "New
here? Start here" path; and the accessibility paragraph is the eighth FAQ entry rather than a
first-class section.

**T4: Book us.**
Served by the most prominent element on every page (the "Book Us!" button), a Concerts page with
videos and a form, and a Contact page. Gaps: the Concerts page opens with history ("started life as
a small jam session…") rather than with what an organiser gets, which is exactly what
[#93](https://github.com/UkuleleTuesday/website/issues/93) proposes fixing; there is no
information on formats, set length, group size, travel or fee basis; there is no social proof
beside the form ([#174](https://github.com/UkuleleTuesday/website/issues/174)); and the Contact
page is a bare form with no indication of who reads it or how fast. The hero's "Get In touch"
button is ambiguous: a first-timer reads it as "ask a question", an organiser as "book".

**T5: Support us.**
Served mechanically: nav item, `/donate` and `/donate-qr` redirects for printed QR codes, and a
server-side event on the way through. Gaps: the nav item opens a new tab and leaves the site with
no explanation; the only sentence about what the money funds ("costs of running Tuesdays,
maintaining the gear, and organising special theme nights") is inside the Session FAQ. A
`target="_blank"` nav item is also an accessibility and expectation problem: primary navigation
should stay on the site.

**T6: Join WhatsApp.**
Orphaned in practice. `/whatsapp/` is linked only from the WhatsApp icon in the header and footer
social strips. No page mentions the community in text, including the Session page whose readers
are the natural recruits.

**T7: Watch or listen.**
Fine. Concerts has three embeds plus Spotify and YouTube buttons; the socials are in the header and
footer.

**T8: Gigs I can attend.**
Half served. The homepage calendar shows concerts, but the Concerts page, where someone wanting to
see the group live is most likely to land from search, lists no dates. Event filtering
([#117](https://github.com/UkuleleTuesday/website/issues/117)) would make a concerts-only embed
trivial.

**T9: Contact for other reasons.**
Inconsistent channels. Accessibility accommodations say "let us know!" with no link. Borrowing a
uke says "send us a DM on Instagram or Facebook". The Contact page's meta description talks only
about booking. Three different doors for three ordinary requests.

**T10: Code of Conduct.**
Orphaned: one inbound link, from the WhatsApp gate. The page embeds a PDF that does not render on
phones ([#84](https://github.com/UkuleleTuesday/website/issues/84)). Not in the footer. A code of
conduct that cannot be found is not doing its job.

**T11 to T15.** Not served today. [#93](https://github.com/UkuleleTuesday/website/issues/93),
[#94](https://github.com/UkuleleTuesday/website/issues/94) and
[#174](https://github.com/UkuleleTuesday/website/issues/174) already describe three of them.

### 4.2 Summary matrix

Legend: ● served well, ◐ served but with friction or buried, ○ not served.

| Task | Homepage above fold | Nav | Dedicated page | Footer | Verdict |
|---|:-:|:-:|:-:|:-:|:-:|
| T1 Is it on, when, where | ○ | ◐ ("Play-Along Session") | ● | ● (time, address) | ◐ |
| T2 Songbook | ● | ● | ◐ (extra hop) | ○ | ● |
| T3 What is it, beginners | ○ | ◐ | ● | ○ | ◐ |
| T4 Book us | ◐ ("Get In touch") | ● (button) | ◐ | ◐ ("Say hi") | ◐ |
| T5 Support us | ○ | ◐ (new tab, off-site) | ○ | ○ | ◐ |
| T6 WhatsApp | ○ | ◐ (icon only) | ● | ◐ (icon only) | ◐ |
| T7 Watch, listen | ○ | ○ | ● (Concerts) | ◐ (icons) | ● |
| T8 Gigs to attend | ○ | ○ | ○ | ○ | ◐ (calendar only) |
| T9 Other contact | ○ | ○ | ◐ | ● | ◐ |
| T10 Code of Conduct | ○ | ○ | ◐ (PDF) | ○ | ○ |
| T11 Community group | ○ | ○ | ○ | ○ | ○ |
| T12 Volunteer | ○ | ○ | ○ | ○ | ○ |
| T13 Press assets | ○ | ◐ ("Press") | ○ | ○ | ○ |
| T14 Governance | ○ | ○ | ○ | ○ | ○ |

---

## 5. Structural findings

**F1. Navigation is a content list, not a task list.**
The five items are the WordPress pages that survived the migration. Labels are the organisation's
nouns: "Concerts" is a booking pitch rather than a list of concerts; "Press" is six quotes;
"Play-Along Session" is accurate but is our term, not a newcomer's. Contact and About, the two
items nearly every small-organisation site carries, are absent. One of five slots goes to the
least-visited page.

**F2. The homepage is a brochure, not a task hub.**
Order today: hero (H1 with no information, two buttons), a tagline band, "Play Along With Us"
(the first useful facts), "See Us Live", "Upcoming Events", footer. On the phone baseline the
calendar starts roughly four screens down. The two hero buttons serve T2 and an ambiguous mix of
T4 and T9. The single most useful sentence on the site ("every Tuesday from 8pm, upstairs at the
Stag's Head, free entry, all levels welcome") is a body paragraph.

**F3. Orphans and near-orphans.**
Inbound internal links per page (excluding the page linking to itself):

| Page | Inbound links | From |
|---|:-:|---|
| `/songbook/` | 4 | Nav, hero, Session page (twice) |
| `/contact-us/` | 3 | Header button, hero, footer |
| `/concerts/` | 2 | Nav, homepage button |
| `/tuesday-session/` | 2 | Nav, homepage button |
| `/support-us` | 1 | Nav (new tab) |
| `/testimonials/` | 1 | Nav |
| `/whatsapp/` | 1 | Social icon only |
| `/code-of-conduct/` | 1 | WhatsApp page only |
| `/faq/` | 0 | Sitemap only; page no longer exists |

**F4. The footer does no navigation work.**
Three widgets (a contact sentence, the session time and address, a logo), a copyright line frozen
at 2022, and a maps link that opens in directions mode with no destination shown
([#155](https://github.com/UkuleleTuesday/website/issues/155)). On a small site the footer is the
natural home for the complete page list, the Code of Conduct, WhatsApp, and the one-line legal
description proposed in [#94](https://github.com/UkuleleTuesday/website/issues/94).

**F5. Sitemap and crawl hygiene.**
`static/sitemaps/page-sitemap.xml` lists `/faq/`, which was merged into the Session page in
[#108](https://github.com/UkuleleTuesday/website/pull/108); neither `_redirects` nor `netlify.toml`
redirects it, so the sitemap advertises a 404 (worth confirming on the live site). Every image
entry points at `/wp-content/uploads/…`, a tree that no longer exists. Both sitemap files
reference an XSL stylesheet under a removed WordPress plugin path, and `sitemap_index.xml` lists
post, portfolio, staff, partners and careers sitemaps that do not exist. There is no `robots.txt`
pointing at the sitemap. None of this stops indexing (Lighthouse SEO is 100), but it wastes crawl
attention and the `/faq/` dead end is real for anyone who bookmarked or linked it. The sitemap is
also the last hand-maintained artefact of the WordPress era; `build.py` already knows every page.

**F6. Structured data does not describe what we are.**
`json_ld.html` emits Organization, WebSite, WebPage and BreadcrumbList. There is no `Event` for the
weekly session (recurring, free, at a named `Place` with an address), no `MusicGroup`, and no
`sameAs` links to Instagram, Facebook, YouTube, Spotify or Tripadvisor. An `Event` entry is the
single cheapest thing we can do for T1 in search, because it lets Google show date, time and venue
directly in results for queries like "ukulele dublin tuesday".

**F7. Measurement cannot see tasks.**
`static/js/mixpanel.js` initialises Mixpanel with `autocapture: true` and
`disable_persistence: true`. With persistence disabled the SDK never stores an identity, so every
page load is issued a fresh anonymous id. Consequences: page-view counts per URL and click events
are available; cross-page journeys, funnels, returning visitors and "did the people who read X
then do Y" are not. Contact-form submissions are counted by Netlify Forms; WhatsApp joins and
calendar loads pass through Netlify functions but are not counted anywhere; donate redirects are
counted server-side. The bundle is also the largest JavaScript payload on the site
([#162](https://github.com/UkuleleTuesday/website/issues/162)). No top-tasks survey has ever been
run, and there is no record of Search Console being connected.

**F8. Charm displaces information in headings and labels.**
The site's voice is one of its assets and should stay in body copy. But several places where a
visitor needs a literal answer get a flourish instead: the H1 "Welcome to Ukulele Tuesday", two
"Read More →" buttons, a "Concerts" label on a booking page, and a meta description that jokes
about a lost Mumford & Sons link. Headings, buttons, labels and meta descriptions should say
exactly what the visitor gets.

**F9. Fragmented properties.**
The organisation's presence is spread over `ukuleletuesday.ie`, `songbooks.ukuleletuesday.ie`
(no navigation back, [#69](https://github.com/UkuleleTuesday/website/issues/69)), Facebook events,
Instagram, Tripadvisor, Buy Me a Coffee, and, judging by search results, the original WordPress
site at `ukulele.ie`, which is still live and indexed with a 2011 origin story and outdated session
details. That legacy site competes with this one for the brand query and gives searchers stale
information; it should redirect here or at minimum link here prominently. For T1 the source of
truth is the Google Calendar, so the site should be the canonical answer and every other property
should point at it.

---

## 6. What a task-first structure looks like

### 6.1 Organising principle

Five top tasks, to be confirmed by the poll in section 7:

1. **Come to a session** (when, where, is it on this week, what to expect, accessibility)
2. **Use the songbook**
3. **Book us** (performances, what you get, proof, upcoming public gigs, enquiry form)
4. **Support us** (what it funds, donate)
5. **Join the community** (WhatsApp, Code of Conduct, volunteering)

Everything else (about, governance, press kit, history) lives one level down under About, or in
the footer, and never competes with these five for attention.

### 6.2 Homepage as a task hub

Proposed order, top to bottom:

1. **Answer T1 in the first screen.** A one-line description, then the facts as a fact strip
   rather than prose: *Every Tuesday, 8pm to 10:30pm. Upstairs at The Stag's Head, Dame Court,
   Dublin 2. Free. All levels. House ukes available.* Beneath it, one dynamic line fed by the
   calendar: "Next session: Tuesday 30 September" or, on an exception week, "No session this
   Tuesday (bank holiday), back on the 14th". Primary buttons: **Songbook** and **New here? What
   to expect** (links to the Session page).
2. **Book us.** Two sentences on what a performance is, one video or photo, two of the press
   quotes from [#174](https://github.com/UkuleleTuesday/website/issues/174), a **Book us** button.
3. **Upcoming events.** The existing calendar, higher up than today.
4. **Support us.** One sentence on what it costs to run and a donate button.
5. **Join the community.** WhatsApp, volunteering, Code of Conduct, in one short block.

The H1 should state what this is ("Dublin's free weekly ukulele play-along session"), not greet.

### 6.3 Navigation

| Today | Proposed | Why |
|---|---|---|
| Concerts | **Book Us** (page: performances) | Names the task; absorbs the community group ([#93](https://github.com/UkuleleTuesday/website/issues/93)) and the press quotes ([#174](https://github.com/UkuleleTuesday/website/issues/174)) |
| Play-Along Session | **Tuesday Session** | Newcomer's words; matches the brand |
| Songbook | **Songbook** | Unchanged |
| Press | **About** | Story, community group, governance ([#94](https://github.com/UkuleleTuesday/website/issues/94)), Code of Conduct ([#84](https://github.com/UkuleleTuesday/website/issues/84)), press kit if ever needed |
| Support Us (new tab, off-site) | **Support Us** (on-site page, same tab) | Explains what it funds, then sends to Buy Me a Coffee; QR redirects unchanged |
| Book Us! button | Keep on desktop. Consider **Songbook** as the sticky button on phones and test it | The phone audience in the pub is the majority; the organiser audience is on desktop |

Contact does not need a nav slot if it is reachable from the footer on every page, from Book Us,
and from About, but "Contact" is a defensible sixth item if the poll says so.

### 6.4 Footer as utility navigation

Every page in a single column list; Contact; Code of Conduct; WhatsApp; Support Us; the socials;
the session time and a maps link that shows the venue
([#155](https://github.com/UkuleleTuesday/website/issues/155)); the one-line legal description
from [#94](https://github.com/UkuleleTuesday/website/issues/94); a copyright year generated at
build time.

### 6.5 Page by page

- **Tuesday Session.** Keep the content. Add a "Next session" line, a "Join the WhatsApp
  community" block, a short "Get involved" block for volunteers, promote accessibility to a
  section with a link to the contact form, and give the FAQ an `id="faq"` so `/faq/` can redirect
  to it.
- **Book Us (today: Concerts).** Lead with what an organiser gets (format, duration, group size,
  travel, what we need from the venue), then proof (video, quotes, past festivals), then upcoming
  public gigs from a concerts-only calendar, then the form. Move the history to About.
- **Contact.** Keep the form; add two sentences on what to use it for, who reads it, and how
  quickly to expect a reply; list the alternatives (Instagram DM for borrowing a uke) in one
  place instead of scattering them through the FAQ.
- **Support Us.** New short page: what a Tuesday costs to run, what donations have bought, the
  donate button. `/donate` and `/donate-qr` keep redirecting instantly for printed codes.
- **About.** Story (from Concerts and the legacy site), the community group, governance and
  constitution ([#94](https://github.com/UkuleleTuesday/website/issues/94)), Code of Conduct as
  HTML ([#84](https://github.com/UkuleleTuesday/website/issues/84)), photos
  ([#9](https://github.com/UkuleleTuesday/website/issues/9)).
- **Songbook.** Button first, explanation second; link back from the subdomain
  ([#69](https://github.com/UkuleleTuesday/website/issues/69)); click-to-load Spotify
  ([#165](https://github.com/UkuleleTuesday/website/issues/165)).
- **WhatsApp.** Unchanged, but linked in text from the Session page, About and the footer.
- **Testimonials.** Folded away per [#174](https://github.com/UkuleleTuesday/website/issues/174).

### 6.6 Hygiene

- Redirect `/faq/` to `/tuesday-session/#faq` and `/testimonials/` to `/concerts/#press`.
- Generate the sitemap in `build.py` from the template list, drop the WordPress image and
  stylesheet paths, delete the stale sitemap index entries, and add `robots.txt` with a
  `Sitemap:` line.
- Add `Event` (weekly session), `Place` and `sameAs` to the JSON-LD.
- Rewrite meta descriptions to state the page's job in one sentence.
- Ask whoever controls `ukulele.ie` to redirect it here.

---

## 7. Measurement: confirming the ranking and tracking success

### 7.1 The top-tasks poll (two weeks, near-zero cost)

One question, shown once per visit as a small dismissible bar on every page:
*"What did you come to this site to do today?"* followed by the fifteen tasks from section 3 in
random order, one pick, plus "Something else (tell us)". Post it to a Netlify Form named
`top-tasks` with a hidden `source` field, so it needs no JavaScript beyond randomising the order
and no cookies beyond `sessionStorage` to avoid re-asking (strictly functional, no consent
needed). Run the same form from a QR code shown at two Tuesday sessions and post it once in the
WhatsApp group, each with its own `source` value. Report the three populations separately: web
visitors, people in the room, and community members are different people with different top
tasks.

Expect a few hundred answers. If the top-tasks pattern holds, three to five tasks will carry more
than half the votes, and the ranking of T1 to T5 in section 3 will either be confirmed or, more
usefully, corrected before any redesign work starts.

### 7.2 Fixing the analytics

Decide between two honest options, and stop running the current hybrid:

- **Mixpanel with persistence enabled.** Gives journeys and funnels but stores identifiers, which
  under Irish ePrivacy rules means a consent banner. Also keep the bundle problem in
  [#162](https://github.com/UkuleleTuesday/website/issues/162) in mind.
- **A cookieless, server-side or privacy-first counter** (Netlify Analytics, Plausible, Umami).
  Page views, referrers and outbound clicks with no consent banner and no bundle. Journeys are
  lost, but for a site this size task-endpoint counts are what matter.

Either way, instrument the endpoints of the top tasks rather than the pages:

| Task | Success event | Where it is counted |
|---|---|---|
| T1 | Calendar rendered; "Next session" line shown; an event expanded | Client event or function log |
| T2 | Click through to `songbooks.ukuleletuesday.ie` | Outbound click |
| T3 | Session page read past the FAQ heading | Scroll or anchor event |
| T4 | Contact form submitted, with subject classified | Netlify Forms (already) |
| T5 | `/donate`, `/donate-qr`, `/support-us` redirects | Edge function (already) |
| T6 | WhatsApp gate success | `whatsapp-gate` function (add a log line or event) |
| T10 | Code of Conduct viewed | Page view |

Connect Search Console if it is not already, because "what did people search for before landing
here" is the cheapest task evidence available and it is free.

### 7.3 A quarterly task scorecard

One table for the exec: for each top task, the success count for the quarter, the trend, and the
one thing that would move it. Report it alongside the AGM "year in key numbers".

---

## 8. Roadmap

| Phase | What | Effort | Impact | Related issues |
|---|---|---|---|---|
| **0. Hygiene** (this week) | `/faq/` redirect; footer page list, CoC and WhatsApp links, dynamic year; rename "Read More" buttons; fix maps link; text link to WhatsApp on the Session page; sitemap generated by `build.py`; `robots.txt` | S | Medium | [#159](https://github.com/UkuleleTuesday/website/issues/159), [#155](https://github.com/UkuleleTuesday/website/issues/155), [#84](https://github.com/UkuleleTuesday/website/issues/84) |
| **1. Learn** (two weeks) | Top-tasks poll live on site, QR at two sessions, WhatsApp post; analytics decision; Search Console; `Event` structured data | S | High (everything after depends on it) | [#162](https://github.com/UkuleleTuesday/website/issues/162) |
| **2. Restructure** (after the poll) | Homepage as task hub with "Next session" line; nav rename; Book Us page absorbs Concerts, community group and press quotes; Support Us on-site page; About page with CoC as HTML and governance | M to L | High | [#93](https://github.com/UkuleleTuesday/website/issues/93), [#94](https://github.com/UkuleleTuesday/website/issues/94), [#174](https://github.com/UkuleleTuesday/website/issues/174), [#117](https://github.com/UkuleleTuesday/website/issues/117) |
| **3. Measure and maintain** | Task-endpoint events; quarterly scorecard; photo refresh; legacy `ukulele.ie` redirect; songbook subdomain nav back | S to M | Medium | [#9](https://github.com/UkuleleTuesday/website/issues/9), [#69](https://github.com/UkuleleTuesday/website/issues/69) |

Effort: S under a day, M one to three days, L a week of part-time volunteer work.

The order matters. Phase 0 is safe regardless of what the poll says. Phase 2 should wait for the
poll, because it is the phase where a wrong assumption is expensive: if it turns out that
organisers, not session-goers, are the dominant web audience, the homepage and the sticky button
should be built the other way round.

---

## 9. GTD view: projects and next actions

Written so they can be lifted straight into the Projects and Next Actions lists.

**Project: Website hygiene fixed** (outcome: no dead ends, every page reachable from the footer,
sitemap generated by the build)
- Next action: add `/faq/ /tuesday-session/#faq 301` to `static/_redirects` and `id="faq"` to the
  Session page FAQ heading.
- Next action: replace the footer widgets with a page list, CoC, WhatsApp, socials and a generated
  year.
- Next action: rename the two "Read More →" buttons to "About the Tuesday session" and "About
  performances and booking".
- Next action: write the sitemap from `build.py`'s template list and delete the WordPress paths.

**Project: Top tasks confirmed by a poll** (outcome: a ranked list backed by at least 200 answers
from at least two populations)
- Next action: draft the fifteen-option poll and get the wording agreed on the exec WhatsApp.
- Next action: add the poll bar as a partial posting to a `top-tasks` Netlify Form with a
  `source` field.
- Next action: print two QR posters for the next two Tuesdays.

**Project: Homepage and navigation rebuilt around the confirmed top tasks** (outcome: the first
screen answers T1, nav labels name tasks, Concerts becomes Book Us, Support Us stays on-site)
- Next action: sketch the five-block homepage and the six-item nav on one page and circulate it.
- Next action: write the "Next session" calendar line as a function of the existing calendar
  feed.

**Project: Task success measurable** (outcome: a quarterly scorecard with one number per top task)
- Next action: decide Mixpanel-with-consent versus a cookieless counter, and record the decision
  on [#162](https://github.com/UkuleleTuesday/website/issues/162).
- Next action: connect Search Console for `ukuleletuesday.ie`.
- Next action: add a success log line to `whatsapp-gate.js`.

---

## Appendix A: Page inventory

Word counts are visible copy including headings and form labels. "Last content change" is the
page's own `article_modified_time`, or the sitemap `lastmod` where the template has none.

| URL | Template | Words | Last content change | Primary job today | Inbound links |
|---|---|:-:|---|---|:-:|
| `/` | `index.html` | 257 | 2025-07-25 | Brochure: hero, tagline, two teasers, calendar | all (logo) |
| `/tuesday-session/` | `tuesday-session/index.html` | 823 | 2025-07-25 | What the session is; directions; nine-question FAQ | 2 |
| `/concerts/` | `concerts/index.html` | 232 | 2026-09-26 | Booking pitch: history, festivals, videos, enquiry form | 2 |
| `/songbook/` | `songbook/index.html` | 180 | 2025-07-25 | Link to the songbooks subdomain; Spotify playlist | 4 |
| `/testimonials/` | `testimonials/index.html` | 156 | 2023-09-20 | Six press and review quotes | 1 |
| `/contact-us/` | `contact-us/index.html` | 124 | 2022-08-15 | Bare Netlify contact form | 3 |
| `/whatsapp/` | `whatsapp/index.html` | 172 | 2025-06-26 | Code-of-conduct gate in front of the WhatsApp invite | 1 |
| `/code-of-conduct/` | `code-of-conduct/index.html` | 137 | 2023-10-24 | Intro paragraph and an embedded PDF | 1 |
| `/faq/` | none | 0 | 2025-07-25 (sitemap) | Merged into the Session page in #108; still in the sitemap | 0 |
| `/support-us`, `/donate`, `/donate-qr` | edge function | 0 | n/a | Server-side Mixpanel event then 302 to Buy Me a Coffee | 1 |

## Appendix B: Internal link graph

| From | To |
|---|---|
| Header (all pages) | `/`, `/concerts/`, `/tuesday-session/`, `/songbook/`, `/testimonials/`, `/support-us` (new tab), `/contact-us` (button), `/whatsapp/` (icon), Instagram, Facebook, Tripadvisor, YouTube |
| Footer (all pages) | `/contact-us/`, Google Maps directions, `/`, `/whatsapp/` (icon), the same four socials |
| `/` | `/songbook/`, `/contact-us`, `/tuesday-session/`, `/concerts/`, TradFest, Ukulele Hooley, Galway Uke Fest, Monopolele |
| `/tuesday-session/` | `/songbook/` (twice), `/#upcoming-events`, Stag's Head parlour bar, Buy Me a Coffee, Instagram, Facebook, Citizens Information, Got A Ukulele |
| `/concerts/` | three YouTube videos, Spotify artist, YouTube channel; contains the enquiry form |
| `/songbook/` | `songbooks.ukuleletuesday.ie` (new tab); Spotify embed |
| `/testimonials/` | six external sources |
| `/whatsapp/` | `/code-of-conduct/` (new tab); posts to `whatsapp-gate` |
| `/code-of-conduct/` | `/assets/Code-of-Conduct.pdf` |
| `/contact-us/` | none; contains the form |

## Appendix C: References

- Gerry McGovern, *Top Tasks: A How-to Guide* (2018), and the summary at
  [gerrymcgovern.com](https://gerrymcgovern.com/top-tasks/).
- Nielsen Norman Group, [Social Proof in UX](https://www.nngroup.com/videos/social-proof-ux/)
  and ["About Us" information on websites](https://www.nngroup.com/articles/about-us-information-on-websites/).
- Google Search Central, [Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event).
- Earlier spikes in this folder: the 2026-03-19 Lighthouse audit and the 2026-03-21 WordPress
  legacy and optimisation review.
- External pages that currently answer T1 for searchers: the
  [Tripadvisor listing](https://www.tripadvisor.ie/Attraction_Review-g186605-d25399502-Reviews-Ukulele_Tuesday-Dublin_County_Dublin.html),
  the [Stag's Head event page](https://stagshead.ie/event/ukelele-tuesday/), the
  [Dublin Learning City listing](https://dublinlearningcity.ie/event/ukulele-tuesday/), and the
  legacy site at [ukulele.ie](https://ukulele.ie/).
