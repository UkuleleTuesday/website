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
overturn it. Twelve months of Google Search Console data were added on 27 September 2026 and are
analysed in section 3.1. Mixpanel data is still pending
([#177](https://github.com/UkuleleTuesday/website/issues/177)); the Mixpanel figure quoted by the
team (very low traffic to `/testimonials/`) is taken on trust, though the search data points the
same way.

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

One audience needs separate mention: event and festival organisers. Their traffic is tiny and
each of their visits is worth more than hundreds of others, which is exactly what a page-view
ranking hides. The site currently tells them neither what kind of act we are (a band, with
ukuleles through line-in and effects, further instrumentation and multiple layers of vocal
harmony, not an acoustic ukulele ensemble) nor what they can book beyond a set (play-along jam
sessions and workshops), and gives their sound engineer nothing to plan from. Sections 4.1, 5
(F10) and 6.5 treat this as a first-class gap. Much of the missing material already exists in the
2025 press kit working document that the group emails when hunting for gigs (bios, a
live-requirements table, sample work with view counts, notable performances, a fuller and fresher
set of press quotes). It is simply not on the site.

Twelve months of Google Search data (section 3.1) sharpen the picture rather than change it. The
songbook is the biggest named task arriving from search. Clicks run two and a half times higher on
Tuesdays than on any other day. People who do not know the name find us by searching for a ukulele
group, club or class in Dublin, and the pages that answer them have titles that use none of those
words. Band-hire searches were shown about 1,350 times in the year and clicked once. The dead `/faq/`
URL was shown 679 times, though Google has dropped it in the last three months. And the apex
host without www still appears as a separate result at the same rate as a year ago, despite a
redirect that has existed since November 2025, which points to a redirect that is not being served
(section 3.2). The search data also shows the main-site songbook page and the songbook microsite
competing for the same searches, with the wrong one winning: five in six songbook searchers land
on the page that links to the songbook rather than on the songbook (F11).

**Recommendation:** adopt a short list of top tasks as the organising principle, confirm the
ranking with a two-week one-question poll, restructure the homepage, navigation and footer around
the confirmed top tasks, and fix measurement so each top task has a success metric. A phased
roadmap with effort estimates is in section 8.

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
- Frequency is not the only weight. A task that few visitors have but that carries most of the
  value, such as a festival booking, is a top task by importance. The method allows a strategic
  weighting alongside the vote, and this site needs one.

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
| **Event or festival organiser** | Planning a programme, usually with a sound engineer to brief | What kind of act are you and what do you actually sound like, what can I book besides a set (jam session, workshop), what do you need technically, past gigs, availability, fee basis, how to book | Google, referrals from other festivals |
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
| T4 | **Book the group for an event** | "Book Us!" on every page; a form on two pages; the Concerts copy is a pitch. Fewest visits of the top five and by far the highest value per visit; the exec's "money raised" priority leans on it |
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

Ranked by frequency alone, T4 sits fourth. Weighted by what each visit is worth, it is first or
second, and the site should be judged on it accordingly. Section 4.1 and finding F10 treat it that
way.

### 3.1 Evidence: twelve months of Google Search (25 September 2025 to 24 September 2026)

**Source.** The Search Console performance export for the `ukuleletuesday.ie` Domain property
(all hosts and protocols, which is why the apex host and the songbooks subdomain appear below), web
search only, committed under `docs/spikes/data/2026-09-top-tasks/search-console/` together with
the script that produced these tables. **Limits.** Google web search only: no Maps, no Tripadvisor,
no social, no direct or WhatsApp traffic. Google withholds rare queries, so the query table
accounts for about half of all clicks. A click is still not a task, and nothing here says what
happened after it.

| Measure | Twelve months |
|---|---|
| Clicks | 3,151, about 9 a day |
| Impressions | 38,181 |
| Mobile share of clicks | 65% (desktop 29%, tablet 6%) |
| Ireland share of clicks | 65%, then United States 9%, United Kingdom 7%, Germany 4% |
| Tuesday | 17.6 clicks a day against 7.2 on the other six days, a 2.5 times spike |
| Seasonality | Flat: 220 to 300 clicks every month, no summer bump |

**Where the clicks land**

| Page | Clicks | Share | Impressions | CTR | Avg. position |
|---|--:|--:|--:|--:|--:|
| `/` | 1,917 | 59% | 20,101 | 9.5% | 8.2 |
| `/songbook/` | 855 | 26% | 16,034 | 5.3% | 16.6 |
| `songbooks.ukuleletuesday.ie` | 173 | 5% | 3,395 | 5.1% | 5.4 |
| `ukuleletuesday.ie/` (apex host, no www) | 129 | 4% | 6,015 | 2.1% | 5.9 |
| `/tuesday-session/` | 87 | 3% | 5,385 | 1.6% | 5.9 |
| `/concerts/` | 26 | 1% | 4,495 | 0.6% | 9.5 |
| `/whatsapp/` | 26 | 1% | 1,519 | 1.7% | 4.8 |
| `/assets/Code-of-Conduct.pdf` | 8 | | 372 | 2.2% | 19.3 |
| `/contact-us/` | 2 | | 1,316 | 0.15% | 3.7 |
| `/testimonials/` | 2 | | 749 | 0.3% | 4.3 |
| `/faq/` (no longer exists) | 2 | | 679 | 0.3% | 5.4 |
| `/code-of-conduct/` | 2 | | 185 | 1.1% | 4.0 |
| `/support-us` | 0 | | 161 | 0% | 3.0 |

**What people typed** (the visible half of clicks, grouped by intent)

| Intent | Clicks | Impressions | Typical queries |
|---|--:|--:|---|
| Brand | 977 | 1,702 | "ukulele tuesday", "ukulele tuesday dublin", "stags head ukulele tuesday" |
| Brand plus songbook | 345 | 425 | "ukulele tuesday songbook", 81% click-through |
| Generic songbook and chords | ~94 | ~4,100 | "ukulele songbook" (1,453 impressions at position 18), "ukulele songbook pdf", "3 chord ukulele songs pdf" |
| Finding a group to join | ~139 | ~4,000 | "ukulele dublin" (980), "ukulele groups near me", "ukulele group dublin", "ukulele clubs near me", "… for adults", "… for beginners", "ukulele ireland" (840, zero clicks) |
| Learning | ~5 | ~640 | "ukulele lessons dublin" (382), "ukulele classes dublin", "ukulele classes near me", "ukulele workshops" |
| Booking a band | 1 | ~1,350 | "ukulele bands ireland" (698 at position 5), "ukulele band ireland", "ukulele wedding band ireland", "ukulele concert" |
| Tonight, this week, times | 0 | ~10 | almost nothing |
| WhatsApp, Code of Conduct, donate, press | 0 | ~10 | nothing |

**What it confirms and what it changes**

1. **The songbook is the largest named task arriving from search.** "ukulele tuesday songbook" is
   the second biggest query on the site with an 81% click-through, and the two songbook URLs take
   32% of all clicks. T2 moves up to joint first for the web audience. The data also shows a second
   audience the report had not weighed: ukulele players anywhere looking for a songbook. That is
   16,000 impressions on `/songbook/` at an average position of 17, and it is most of the 35% of
   clicks that come from outside Ireland. Reach rather than a top task, but a reason to keep the
   songbook page strong and linked back to the site
   ([#69](https://github.com/UkuleleTuesday/website/issues/69)). It also shows which of the two
   songbook URLs wins the brand query: "ukulele tuesday songbook" earns 345 clicks a year at
   position 1, and the microsite has only 173 clicks in total, so the main-site page is the one
   capturing those searchers and sending them on with a second click (F11,
   [#180](https://github.com/UkuleleTuesday/website/issues/180)).
2. **T1 shows up as a day, not as words.** Nobody types "is ukulele tuesday on tonight"; they type
   the brand name on a Tuesday, and Tuesday clicks run at two and a half times any other day. Brand
   clicks cannot be split by intent in this data, which is exactly the gap the poll fills. The
   weekday pattern is nonetheless the strongest evidence in the file that the first screen should
   answer tonight's question.
3. **T3 is the main way in for people who do not know the name.** About 140 visible clicks and
   roughly 4,000 impressions come from people looking for a ukulele group, club or class in Dublin
   or Ireland, with "for adults" and "for beginners" in the long tail. The pages that answer them
   rank well and convert badly: `/tuesday-session/` gets 1.6% of clicks at an average position of 6
   because its title, "Ukulele Tuesday Play-Along Session", contains none of the words those people
   typed. "ukulele ireland" and "uke ireland" alone are 1,400 impressions with zero clicks. Titles
   and descriptions written in the searcher's words are the cheapest fix in this report.
4. **T4 demand exists, and the site fails it.** Around 1,350 impressions in the year for band-hire
   queries, including "ukulele bands ireland" shown 698 times at position 5, produced one click.
   The Concerts page appears for these searches and nothing in its title or snippet says "a band
   you can book". Wedding-band queries also appear; whether private events are wanted is a decision
   for [#178](https://github.com/UkuleleTuesday/website/issues/178). This is the search evidence for
   F10.
5. **Learning is a demand the site does not name.** About 640 impressions for lessons, classes and
   workshops in Dublin. The session is beginner-friendly and workshops are a real offer; neither is
   discoverable.
6. **The secondary pages rank in the order the report guessed.** Google shows them as sitelinks
   under the brand result, and their click rates order them: WhatsApp 1.7% and Session 1.6%,
   Concerts 0.6%, Testimonials 0.3%, Contact 0.15%, Support Us 0%. The Press page was shown 749
   times and clicked twice, which settles
   [#174](https://github.com/UkuleleTuesday/website/issues/174).
7. **The hygiene findings come with numbers.** `/faq/` was shown 679 times in the year, though
   none of them in the last three months (section 3.2), so Google has already dropped it and the
   redirect now matters for bookmarks and inbound links rather than for search. The apex host
   without www was served as a separate result 6,015 times with 129 clicks, at an unchanged rate in
   the most recent three months, and a WordPress-era `/sample-page/` appeared under it earlier in
   the year. The apex is canonicalisation work for Phase 0 and needs a live check, not more data.
8. **Phones are the audience, not a slogan.** Two thirds of clicks are on phones, and phone users
   click twice as often as desktop users (10.5% against 5.3%), because desktop impressions are
   dominated by generic songbook searches.

**Revised view of the ranking for the web audience.** T2 (songbook) and T1 (come to a session)
share first place. T3 (discovery by people who do not know the name) is third and the best growth
lever. T4 (booking) is fourth by volume and first by value, with demonstrated unmet demand. T5 to
T10 are on-site tasks with no search demand at all. The people in the room and the WhatsApp
community are still unmeasured, and brand clicks are still unsplit by intent, so the poll
([#179](https://github.com/UkuleleTuesday/website/issues/179)) stands.

### 3.2 Three-month check (25 June to 24 September 2026)

A second export covering only the last three months, committed under `last-3-months/` beside
the first with a comparison script, tests whether the twelve-month picture is still current.
Figures are per 30 days.

| | Twelve-month average | Last three months |
|---|--:|--:|
| Clicks, all pages | 259 | 277 |
| Homepage clicks | 158 | 167 |
| `/songbook/` clicks | 70 | 72 |
| `songbooks.ukuleletuesday.ie` clicks | 14 | 21 |
| `/tuesday-session/` clicks | 7 | 9 |
| `/concerts/` clicks | 2 | 3 |
| Apex host `ukuleletuesday.ie/`, impressions and clicks | 494 and 11 | 517 and 12 |
| `/testimonials/` impressions | 62 | 41 |
| `/faq/` impressions | 56 | 0 |
| Tuesday clicks a day, against the other six days | 17.6 against 7.2 | 17.7 against 7.9 |

- **Nothing in the ranking changes.** Brand, songbook and discovery clicks per month are within a
  few percent of the annual average, the Tuesday spike is intact, phones are 68% of clicks and
  Ireland 65%.
- **The songbooks subdomain is growing.** Clicks per month are up by almost half and impressions by
  57%, while `/songbook/` slipped from position 18 to 23 on generic songbook queries. Google is
  starting to send songbook searchers straight to the subdomain, which strengthens the case for a
  way back to the main site ([#69](https://github.com/UkuleleTuesday/website/issues/69)) and for
  letting the microsite be the only songbook target (F11,
  [#180](https://github.com/UkuleleTuesday/website/issues/180)).
- **Demand for lessons is rising.** "ukulele lessons dublin" earned 147 impressions in three
  months, more than a third of its annual total, and the long tail adds "for beginners" and "for
  adults".
- **Wedding-band queries are seasonal.** They are absent from the summer window, so judge that
  demand on the annual figure. "ukulele bands ireland" continues at 136 impressions and one click.
- **`/faq/` has gone from results**, and `/testimonials/` is fading on its own at 41 impressions
  and about one click a month. Neither changes the plan; both lower the urgency.
- **The apex host has not faded.** It is served as a separate result at the rate of a year ago,
  about 520 impressions and 12 clicks a month at an average position of 6, although the redirect
  in `netlify.toml` dates from 17 November 2025 and the apex resolves to Netlify's load balancer.
  A working 301 would have let Google fold the two hosts together within weeks. The redirect is
  therefore probably not being served, and the next step is a live check rather than more data:
  `curl -I https://ukuleletuesday.ie/`; the URL Inspection tool in Search Console for that URL,
  which reports the fetched status and Google's chosen canonical; the Netlify domain settings (is
  the apex added as an alias, is www the primary domain); and the deploy log for a rejected rule,
  since the rule carries a `headers` option that Netlify documents for proxy rules only. Until
  then it stays open in Phase 0.

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
phone in a noisy pub, one tap fewer matters. The search data shows how often that tap is paid:
the main-site page, not the microsite, wins the query "ukulele tuesday songbook", so roughly five
in six songbook searchers arrive one click short of the songbook (F11).

**T3: What is it, can I join as a beginner?**
The Session page does this well: 823 words, a clear intro, honest accessibility information
(narrow stairs, no lift), house ukes, requests welcome, 18-and-over. The gaps are in getting there
and in emphasis: the homepage offers one paragraph and a "Read More →" button that does not say
where it goes ([#159](https://github.com/UkuleleTuesday/website/issues/159)); there is no "New
here? Start here" path; and the accessibility paragraph is the eighth FAQ entry rather than a
first-class section.

**T4: Book us.**
Served by the most prominent element on every page (the "Book Us!" button), a Concerts page with
videos and a form, and a Contact page. The mechanics exist; the substance does not.

The page never says what kind of act Ukulele Tuesday is. The word "ukulele" and the festival list
lead an organiser to expect an acoustic ukulele ensemble. What turns up is a band: ukuleles
through line-in with effects, further instrumentation, and multiple layers of vocal harmony. That
mismatch costs twice. Programmers may put us in the wrong slot or on the wrong stage, or pass on us
because they wanted something we are not. And the sound engineer meets the input list on the day,
because there is no tech rider, stage plot, PA or soundcheck information anywhere on the site.

The page also undersells. A festival booking can include a play-along jam session for the
festival's own audience, and we can run workshops, and neither is mentioned. Those are exactly the
things a festival programmer buys, and they are the difference between "a band" and "a day of
programme".

Some of this has already been written down, just not here. The 2025 press kit working document,
which the group sends when hunting for gigs, holds short and extended bios, a live-requirements
table (five vocal mics, eight ukulele line-ins, bass, percussion, flute and cajon mics), sample
work with view counts, notable performances (headline slots at Monopolele Fringe, Galway and
Wexford; opening for Andrew Molina, Daniel Ho, Dead Man's Uke and Charlotte Pelgen; a
collaboration with six-time Grammy winner Daniel Ho), and fourteen press quotes and mentions,
among them Aldrine Guerrero and a 2024 Newstalk feature. None of it is on the website, so the
site's own booking page is thinner than the PDF the group emails. The kit in turn still lacks the
jam session and workshop offers, a stage plot, PA and monitor needs, set lengths, numbers on
stage, photos and a logo.

The remaining gaps are the ones already on file: the page opens with history ("started life as a
small jam session…") rather than with what an organiser gets, which is what
[#93](https://github.com/UkuleleTuesday/website/issues/93) proposes fixing; there is no
information on formats, set length, group size, travel or fee basis; there is no social proof
beside the form ([#174](https://github.com/UkuleleTuesday/website/issues/174)); the Contact page
is a bare form with no indication of who reads it or how fast; and the hero's "Get In touch"
button is ambiguous, read as "ask a question" by a first-timer and as "book" by an organiser.

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

**T11 to T15.** Not served on the site today. For T13 a press kit exists as a working PDF that
the group emails; putting its content on the Book Us page is part of
[#178](https://github.com/UkuleleTuesday/website/issues/178). [#93](https://github.com/UkuleleTuesday/website/issues/93),
[#94](https://github.com/UkuleleTuesday/website/issues/94) and
[#174](https://github.com/UkuleleTuesday/website/issues/174) already describe three of them.

### 4.2 Summary matrix

Legend: ● served well, ◐ served but with friction or buried, ○ not served.

| Task | Homepage above fold | Nav | Dedicated page | Footer | Verdict |
|---|:-:|:-:|:-:|:-:|:-:|
| T1 Is it on, when, where | ○ | ◐ ("Play-Along Session") | ● | ● (time, address) | ◐ |
| T2 Songbook | ● | ● | ◐ (extra hop) | ○ | ● |
| T3 What is it, beginners | ○ | ◐ | ● | ○ | ◐ |
| T4 Book us | ◐ ("Get In touch") | ● (button) | ◐ (no sound, offer or tech information) | ◐ ("Say hi") | ◐ |
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
Search Console puts a number on it: `/faq/` was shown in Google results 679 times in the twelve
months to September 2026, none of them in the last three (sections 3.1 and 3.2), so Google has
dropped it and the redirect now protects bookmarks and inbound links rather than search traffic.

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
exactly what the visitor gets. The search data shows the price of not doing so: the Session page
is shown for "ukulele group dublin", "ukulele groups near me" and "ukulele classes dublin" at an
average position of 6 and earns 1.6% of the clicks, because its title says "Play-Along Session"
and none of the words people typed (section 3.1).

**F9. Fragmented properties.**
The organisation's presence is spread over `ukuleletuesday.ie`, `songbooks.ukuleletuesday.ie`
(no navigation back, [#69](https://github.com/UkuleleTuesday/website/issues/69)), Facebook events,
Instagram, Tripadvisor, Buy Me a Coffee, and, judging by search results, the original WordPress
site at `ukulele.ie`, which is still live and indexed with a 2011 origin story and outdated session
details. That legacy site competes with this one for the brand query and gives searchers stale
information; it should redirect here or at minimum link here prominently. For T1 the source of
truth is the Google Calendar, so the site should be the canonical answer and every other property
should point at it. Search Console adds one more split: the apex host `ukuleletuesday.ie` without
www was served as a separate search result 6,015 times in the year, with 129 clicks, and at the
same rate in the most recent three months, although the redirect in `netlify.toml` has existed
since November 2025 and the apex resolves to Netlify. A working 301 would have consolidated the
two hosts long ago, so the redirect is probably not being served; section 3.2 lists the checks.

**F10. The organiser audience is under-served in proportion to its value.**
Organisers are a tiny share of visits and a large share of the value the site can create, which is
exactly the audience a page-view ranking undercounts. Today the booking page describes our history
and our viral videos; it does not describe the act. It does not say that we are a band rather than
an acoustic ukulele ensemble, it offers nothing a sound engineer can plan from, it does not mention
that a festival booking can include a play-along jam session or a workshop, and it gives no sense
of format, numbers, travel or fee basis. The enquiry form then arrives with no indication of which
of those things the organiser wanted, so we cannot even count the demand after the fact. The
2025 press kit working document already covers the bio, live requirements, sample work, notable
performances and press, but it lives in a shared drive rather than on the site, so the emailed PDF
says more about the act than the website does. Search data puts a number on the cost: about 1,350
band-hire impressions in a year, one click (section 3.1). Tracked in
[#178](https://github.com/UkuleleTuesday/website/issues/178).

**F11. The songbook page and the songbook microsite compete, and the wrong one wins.**
`songbooks.ukuleletuesday.ie` has existed since last year: a static microsite, rebuilt weekly,
that always carries the current songbook. The main site still has `/songbook/`, a page whose job
is to link to it. Both carry "Ukulele Tuesday" and "Songbook" in their titles, so Google splits
the ranking signal between them, and the split falls the wrong way.

| | `/songbook/` on the main site | `songbooks.ukuleletuesday.ie` |
|---|--:|--:|
| Clicks, twelve months | 855 | 173 |
| Impressions | 16,034 | 3,395 |
| Average position | 16.6 | 5.4 |
| Clicks per 30 days, last three months | 72 | 21 |
| Trend on generic "ukulele songbook" queries | slipped from position 18 to 23 | impressions up 57% |

"ukulele tuesday songbook" is the second biggest query on the site, 345 clicks a year at position
1 with an 81% click-through, and the microsite has only 173 clicks in total, so the main-site page
is the one winning that query. Every one of those visitors wanted the songbook, landed on a page
that links to it, and clicked again into a new tab. Roughly five in six songbook-intent search
arrivals take that detour, many of them on a phone in the pub on a Tuesday. From the homepage the
path is three taps: brand search, Songbook in the nav, then the button. The recent window shows
Google already starting to prefer the microsite for generic songbook queries while the main-site
page slides, yet the main-site page still captures the brand query. Section 6.5 gives the fix;
tracked in [#180](https://github.com/UkuleleTuesday/website/issues/180).

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
| Songbook | **Songbook**, pointing straight at the songbook microsite | One tap instead of two for the joint top task; the main-site page redirects there (F11, [#180](https://github.com/UkuleleTuesday/website/issues/180)) |
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
- **Book Us (today: Concerts).** Rewrite it as an offer sheet, in this order:
  1. *What we are.* Two or three plain sentences on the sound: a band, ukuleles through line-in
     with effects, further instrumentation, multiple layers of vocal harmony, a pop repertoire,
     loud and joyful. Say explicitly what we are not: an acoustic strum-along. Put the video that
     best conveys the real sound right here.
  2. *What you can book.* Three offers, a paragraph each: a performance (set lengths, group size,
     travel radius); a play-along jam session for your audience (house ukes, projected songbook,
     what it needs from the venue); a workshop (what we run, for whom, numbers).
  3. *What we need.* A tech rider as an HTML page and a PDF: input list, stage plot, PA and
     monitor needs, soundcheck time, a contact for the sound engineer. Also the practical answers
     organisers ask for: fee basis, minimum notice, what we bring.
  4. *Proof.* The press quotes from [#174](https://github.com/UkuleleTuesday/website/issues/174),
     the festival list, the community group
     ([#93](https://github.com/UkuleleTuesday/website/issues/93)).
  5. *Where to see us next.* A concerts-only view of the calendar
     ([#117](https://github.com/UkuleleTuesday/website/issues/117)).
  6. *The form*, with one added field: "What are you enquiring about?" with performance, jam
     session, workshop and other as options. That field is also how we start counting T4 demand.

  Move the history to About. Seed all of this from the 2025 press kit working document rather
  than writing from scratch, and publish it once: the page is the kit, with a PDF generated from
  the same content for organisers who want an attachment. Use the kit's stronger and fresher
  proof (Aldrine Guerrero, the 2024 Newstalk feature, Dublin by Locals 2025, the Daniel Ho
  collaboration, Dirty Old Town's 1.3 million views) rather than the six quotes on the current
  Press page. Tracked in [#178](https://github.com/UkuleleTuesday/website/issues/178).
- **Contact.** Keep the form; add two sentences on what to use it for, who reads it, and how
  quickly to expect a reply; list the alternatives (Instagram DM for borrowing a uke) in one
  place instead of scattering them through the FAQ.
- **Support Us.** New short page: what a Tuesday costs to run, what donations have bought, the
  donate button. `/donate` and `/donate-qr` keep redirecting instantly for printed codes.
- **About.** Story (from Concerts and the legacy site), the community group, governance and
  constitution ([#94](https://github.com/UkuleleTuesday/website/issues/94)), Code of Conduct as
  HTML ([#84](https://github.com/UkuleleTuesday/website/issues/84)), photos
  ([#9](https://github.com/UkuleleTuesday/website/issues/9)).
- **Songbook.** Stop running two songbook pages. Redirect `/songbook/` and everything under it to
  the microsite with a 301, point the nav item, the homepage button and the Session-page links
  straight at the microsite in the same tab, and move the two things the page carries (the
  editions paragraph and the Spotify playlist, click-to-load per
  [#165](https://github.com/UkuleleTuesday/website/issues/165)) to the microsite or the Session
  page. Check the microsite's title and description so it ranks cleanly for "ukulele tuesday
  songbook" once it is the only target, give it a way back to the main site
  ([#69](https://github.com/UkuleleTuesday/website/issues/69)), and put the same cookieless
  counter on it so the top task stays measurable. The longer-term alternative is to serve the
  microsite under `/songbook/` through a Netlify proxy rewrite, one host and one navigation, which
  depends on the songbook build tolerating a sub-path
  ([#180](https://github.com/UkuleleTuesday/website/issues/180)).
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
- Rewrite every page title and meta description in the searcher's words, using the query table in
  section 3.1. For example: "Ukulele Tuesday: free weekly ukulele group in Dublin, beginners
  welcome" for the Session page; "Book Ukulele Tuesday: a ukulele band for festivals and events in
  Ireland" for Book Us; "Ukulele Tuesday Songbook: free ukulele songbook with chords" for the
  songbook page.
- Check the apex host on the live site with `curl -I https://ukuleletuesday.ie/` and the URL
  Inspection tool; if it answers anything other than a 301 to www, fix it in Netlify's domain
  settings or the redirect rule (section 3.2). Search Console already measures the domain as one
  property, so nothing is needed there. Request removal of `/sample-page/` once the redirect is
  confirmed; `/faq/` has already dropped out of results.

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

Add two organiser-facing options that the longlist folds into T4: "Find out what kind of act you
are and what you need technically" and "Ask about a jam session or workshop at my event".
Organisers will be a handful of answers at most; the point is that their answers stay legible
instead of disappearing into "book the group".

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
| T2 | Songbook opened: the outbound click today, page views on the microsite once `/songbook/` redirects there | Outbound click now; the same cookieless counter on the microsite after [#180](https://github.com/UkuleleTuesday/website/issues/180) |
| T3 | Session page read past the FAQ heading | Scroll or anchor event |
| T4 | Contact form submitted, with the new enquiry-type field (performance, jam session, workshop, other) | Netlify Forms (already), one added field |
| T5 | `/donate`, `/donate-qr`, `/support-us` redirects | Edge function (already) |
| T6 | WhatsApp gate success | `whatsapp-gate` function (add a log line or event) |
| T10 | Code of Conduct viewed | Page view |

Search Console is connected and its twelve-month export is analysed in section 3.1. Keep it as the
standing source of search intent, and re-export it once a year alongside the task scorecard.

### 7.3 A quarterly task scorecard

One table for the exec: for each top task, the success count for the quarter, the trend, and the
one thing that would move it. Report it alongside the AGM "year in key numbers".

---

## 8. Roadmap

| Phase | What | Effort | Impact | Related issues |
|---|---|---|---|---|
| **0. Hygiene** (this week) | `/faq/` redirect; footer page list, CoC and WhatsApp links, dynamic year; rename "Read More" buttons; fix maps link; text link to WhatsApp on the Session page; sitemap generated by `build.py`; `robots.txt`; page titles and meta descriptions rewritten in searchers' words; apex-host redirect checked live and fixed if it is not a 301; `/songbook/` redirected to the microsite and the nav pointed straight at it ([#180](https://github.com/UkuleleTuesday/website/issues/180)) | S | Medium to High (the titles alone address 4,000 impressions a year that convert at 1.6%) | [#159](https://github.com/UkuleleTuesday/website/issues/159), [#155](https://github.com/UkuleleTuesday/website/issues/155), [#84](https://github.com/UkuleleTuesday/website/issues/84) |
| **1. Learn** (two weeks) | Top-tasks poll live on site, QR at two sessions, WhatsApp post; analytics decision; Search Console; `Event` structured data; assemble the organiser offer sheet and tech rider from the 2025 press kit working document ([#178](https://github.com/UkuleleTuesday/website/issues/178)), since they are needed whatever the poll says | S to M | High (everything after depends on it) | [#162](https://github.com/UkuleleTuesday/website/issues/162) |
| **2. Restructure** (after the poll) | Homepage as task hub with "Next session" line; nav rename; Book Us page rebuilt as an offer sheet with the tech rider, absorbing Concerts, the community group and the press quotes; Support Us on-site page; About page with CoC as HTML and governance | M to L | High | [#93](https://github.com/UkuleleTuesday/website/issues/93), [#94](https://github.com/UkuleleTuesday/website/issues/94), [#174](https://github.com/UkuleleTuesday/website/issues/174), [#117](https://github.com/UkuleleTuesday/website/issues/117) |
| **3. Measure and maintain** | Task-endpoint events; quarterly scorecard; photo refresh; legacy `ukulele.ie` redirect; songbook subdomain nav back | S to M | Medium | [#9](https://github.com/UkuleleTuesday/website/issues/9), [#69](https://github.com/UkuleleTuesday/website/issues/69) |

Effort: S under a day, M one to three days, L a week of part-time volunteer work.

The order matters. Phase 0 is safe regardless of what the poll says. Phase 2 should wait for the
poll, because it is the phase where a wrong assumption is expensive: if it turns out that
organisers, not session-goers, are the dominant web audience, the homepage and the sticky button
should be built the other way round.

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
- Data: `docs/spikes/data/2026-09-top-tasks/search-console/`, the Google Search Console exports
  for the twelve months to 24 September 2026 (`last-12-months/`) and for the last three months
  (`last-3-months/`), a README, and the scripts that produce the tables in sections 3.1 and 3.2.
- Internal: *UT Press Kit 2025, working document* (shared drive). The seed for the Book Us page,
  the tech rider and the refreshed proof.
- Earlier spikes in this folder: the 2026-03-19 Lighthouse audit and the 2026-03-21 WordPress
  legacy and optimisation review.
- External pages that currently answer T1 for searchers: the
  [Tripadvisor listing](https://www.tripadvisor.ie/Attraction_Review-g186605-d25399502-Reviews-Ukulele_Tuesday-Dublin_County_Dublin.html),
  the [Stag's Head event page](https://stagshead.ie/event/ukelele-tuesday/), the
  [Dublin Learning City listing](https://dublinlearningcity.ie/event/ukulele-tuesday/), and the
  legacy site at [ukulele.ie](https://ukulele.ie/).
