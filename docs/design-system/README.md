# Ukulele Tuesday design system

Ukulele Tuesday runs a free play-along every Tuesday, upstairs in a Dublin pub, and a band that plays festivals across Ireland. The site should feel like that room: warm, a bit loud, and welcoming to first-timers. It should also answer "when, where, is it free?" before it tells a joke.

This page describes the site **as it should be**, not as it is. The templates still carry a lot of the old WordPress theme. If a template disagrees with this page, this page wins. Check [Retired](retired.md) before you copy any markup, class or colour from an existing page.

Some decisions still need a person to make them; they're listed in [Decisions for a person](decisions.md). Until someone decides, follow the default given there. The rest of this page already does.

## The short version

1. **Facts in headings, fun in the body.** Headings, page titles, buttons, labels and meta descriptions say exactly what the visitor gets. Keep the playful voice for paragraphs.
2. **Use the pieces that exist.** The site has one button, one banner, one band, one frame, one callout, one disclosure and one form field. If a page seems to need something new, ask before you build it.
3. **Every colour is a token.** Don't add new hex values. Each text colour is only used on the grounds listed under Colour.
4. **No inline styles.** No `style=""` attributes and no `onmouseenter` scripts in templates. Styles go in `static/css/custom.css` and use the tokens as CSS custom properties with the same names (`var(--teal-deep)`). The one exception is the Banner's photo, which `_partials/banner.html` passes as `style="--banner-photo: …"`.
5. **Phone first.** Most visitors are holding a phone in the pub. On a phone, every section reads in this order: heading, then the answer, then the picture, then the text, then the button.

## Voice and copy

We're a volunteer-run group of friends who play ukulele in a pub. Write the way one of us would talk to someone at the door: warm, direct, a bit cheeky, never corporate.

- **We and you.** "We" means Ukulele Tuesday and "you" means the reader. Don't write "UT" or "the organisation" in public copy.
- **Answer first, then add charm.** Lead with the fact (time, place, price, what to do), then add colour. "Free, every Tuesday from 8pm. Bring a uke or borrow one of ours." goes before "Play, sing, or just soak up the chaos."
- **Keep jokes in body copy.** The site's jokes are some of its best copy: "if your dog ate your ukulele", "face-melting solos", "you'll end up addicted and buy your own ukulele". Use one per paragraph at most, and never in a heading, button, label or meta description.
- **Irish English.** Use en-GB spelling (organise, colour, programme). A little Hiberno-English suits body copy ("craic"), but not in every paragraph.
- **Short sentences, plain words.** Write "songbook", not "repertoire"; "book us", not "enquire about availability".
- **Rules first, then help.** Policies (age, access, the Code of Conduct) state the rule plainly, then say how to get help: "We're an 18+ event. If you'd like to bring children, ask The Stag's Head first."
- **Emoji and exclamation marks** stay out of headings, buttons, labels, page titles and the promo bar ([Decision 12](decisions.md)). In body copy, use them now and then, not in every paragraph. No text emoticons such as `:-)`.

### Headings, buttons and titles

- **Type every label in sentence case.** Buttons are shown in uppercase by the Button CSS, and so are the desktop nav and the footer headings ([Decision 7](decisions.md)), so never type capitals yourself: write "Book us for your event" and let the CSS do the rest.
- **Headings are in sentence case** ([Decision 8](decisions.md)): "See us live", "How to find us". Proper names keep their capitals: "Code of Conduct", "The Stag's Head".
- **Button labels are a verb plus a thing**, 1 to 5 words, and say where the button goes: "Open the songbook", "Book us for your event", "Join the WhatsApp community", "Send". Never "Read more", "Click here", "Submit" or "Get in touch". "Get in touch" is ambiguous: an organiser reads it as "book", a first-timer as "ask a question".
- **No arrows or symbols in labels.** "Join the session →" becomes "Join the session".
- **Page titles** put what the page answers first, in the words people search for, then the name. For example: `Ukulele band for festivals and events in Ireland | Ukulele Tuesday`.
- **Meta descriptions** are one or two literal sentences, under 155 characters, with no jokes.
- **Link text says where the link goes:** "the Stag's Head parlour bar", "the form below". Never "here".

### House style

| Write | Not |
|---|---|
| Ukulele Tuesday | UT, U.T., Ukulele tuesday |
| the play-along session, then "the session" | Play Along Session, the jam (for the weekly event). See [Decision 4](decisions.md) |
| The Stag's Head | Stags Head, The Stags Head, the Stag's Head pub |
| 8pm, 7:45pm, 8pm to 10:30pm | 8 PM, 20:00, 8.00pm |
| Tuesday 6 October | Tues 6th Oct, 06/10, October 6th |
| every Tuesday | each Tuesday, weekly on Tuesdays |
| free | free of charge, at no cost |
| €50 | 50 euros, EUR 50 |
| ukulele (or uke in body copy) | ukelele, Ukulele mid-sentence |
| the songbook | Songbook, our songbooks page |
| WhatsApp, YouTube, Instagram | Whatsapp, Youtube, insta |
| Code of Conduct | code of conduct, Code Of Conduct |

Times and dates follow the same format as `static/js/calendar.js`, which writes "Tonight from 8pm" and "Next session: Tuesday 6 October, 8pm".

### Examples from the site

| Keep | Change |
|---|---|
| "Yes, if your dog ate your ukulele (or you're flying over and couldn't bring your instrument), we have a bunch of house ukuleles you can borrow." The voice at its best: the answer comes first. | H1 "Welcome to Ukulele Tuesday": says nothing. Put the fact in the heading. |
| "Doors open 8pm, we start playing shortly after." | Buttons "Get In touch", "View Songbook", "Read More →" become "Book us", "Open the songbook", "More about the session". |
| "Festivals and other gigs", "Tell us about your event": literal headings in sentence case. | "Love to play uke? Love to sing? Join us in the Stag's Head, Dame Lane, every Tuesday from 8 PM." Fine as a Band sentence, but write "8pm" and "The Stag's Head". |
| "We usually reply by email within a few days; if your event is soon, say so in your message." | Footer "Tuesdays from 20:00 to 22:30" becomes "Every Tuesday, 8pm to 10:30pm". |

## Colour

The palette is the logo's teal plus three colours that go with it: a deep teal that frames the site, maroon for big moments, and sun-orange for the thing to press. Text is slate-grey for reading and ink for headings, on white.

| Ground | Used for | Text on it |
|---|---|---|
| `surface` | the page | `slate` for body copy, captions and labels (4.55:1); `ink` for headings (12.8:1) |
| `teal-deep` | header, links, focus ring, Frames, Button hover | `surface` (6.9:1) |
| `teal` | Band, phone menu, the "Other" event accent | `ink` (4.8:1). Never white (2.6:1) |
| `maroon` | promo bar, enquiry Band, concerts, Frames | `surface` (12.8:1) |
| `maroon-wash` | the photo overlay in every Banner | `surface` |
| `sun` | primary Button, Frames, play-along events | `ink` (6.2:1). Never white (2.1:1) |
| `sun-tint`, `maroon-tint`, `surface-soft` | Callout backgrounds | `ink` (11+:1). Never `slate` |
| `night` | footer | `on-night` (7.9:1), `surface` for headings and links |

- **`sun` and `teal` are fills, never text.** Orange links and white text on orange or teal were the site's biggest legibility problems ([Decisions 1 and 2](decisions.md)).
- **Links** on light grounds are `teal-deep` and underlined, and turn `maroon` on hover. On dark grounds (`maroon`, `night`, the Banner) they are `surface` and underlined, and turn `sun` on hover. In the `teal-deep` header, nav links stay white and gain an underline on hover.
- **Body copy is `slate`** ([Decision 9](decisions.md)), on white only: it has no contrast to spare, so it never goes on a tint. Headings and anything inside a Callout are `ink`.
- **Event types pair a colour with a word**, always: Play-along is `sun`, Concert is `maroon`, Other is `teal`.
- **Focus ring:** 2px solid, 2px offset. Use `teal-deep` on light grounds, `surface` on dark grounds and `ink` on `teal`. Never remove an outline without replacing it.
- The site has no dark mode.

## Type

The site uses three Google fonts, and each has one job. They are loaded once, in `templates/_layouts/base.html`.

- **Pattaya** (`display`) is the script face that echoes the logo. Use it for the H1 only, once per page, inside the Banner, and keep the H1 short (2 to 5 words). Never use it for body copy, buttons, or anything a visitor must read carefully.
- **Quicksand** (`heading`) is for H2 section headings, the Band sentence and the desktop nav.
- **Poppins** (`body`) is for everything else: paragraphs, H3, buttons, forms, captions, the footer and the calendar.

Rules:

- Each page has one H1 (in the Banner). Use H2 for sections and H3 for points inside a section, such as FAQ questions. Don't skip levels. A slogan is not a heading: the Band sentence is a `<p>`.
- **Uppercase is for interface labels only:** Buttons, the desktop nav and the footer headings. It's applied in CSS, never typed. Small caps labels (13px nav and header button, 16px footer headings) get 1px letter-spacing; the 16px content Buttons get none. Headings and body copy are never in capitals.
- Headings are left-aligned in content columns. Centre them only in a Banner or a Band.
- Headings keep their desktop size on phones ([Decision 11](decisions.md)).
- Keep text columns no wider than `measure` (820px).

## Space and layout

There are six spacing steps. Each one has a job:

- `space-1` (10px): gaps inside a component.
- `space-2` (15px): the gutter, and the page's side padding on phones.
- `space-3` (25px): between blocks in a column (heading, text, button, frame).
- `space-4` (40px): between rows, and the page's side padding on desktop; a Button's side padding.
- `space-5` (60px): Band and footer padding.
- `space-6` (90px): Banner padding.

Layout rules:

- The page is at most `page-max` (1250px) wide. Text columns are at most `measure` (820px), centred.
- A section is either one centred text column, or two columns (copy and a Frame) whose sides alternate down the page. Two-column rows stack on phones in the order given in the short version at the top. The CSS for this already exists as `.media-after-heading`; reuse it rather than writing new ordering rules.
- There are two breakpoints: 768px (columns stack, button rows stack) and 979px (the header switches to the phone menu). Don't add others.

## Shape

- **Radii:** `radius-pill` for Buttons and the session pill, `radius-lg` (20px) for form inputs, `radius-md` (10px) for Frames, and `radius-sm` (4px) for Callouts. Nothing else.
- **Frames:** photos and videos sit in a `frame-width` (15px) coloured border with `radius-md`. Frame colours rotate down the page: `teal-deep`, then `maroon`, then `sun`. Two neighbouring frames never share a colour. Maps, the Spotify player and logos don't get frames.
- **The wave:** every Band ends in the brush-stroke wave (`templates/_partials/shape-divider.html`), filled with `surface`, on the edge that meets the white page.
- **Shadows:** there are two. `shadow-button` sits under every Button except the header's, and drops away on hover ([Decision 10](decisions.md)). `shadow-raised` lifts the session pill off the Banner photo and a calendar Callout on hover. Frames are flat.
- **Motion:** colour and shadow changes take 0.2s ease on hover and focus. The Banner photo stays still while the page scrolls ([Decision 3](decisions.md)). Nothing else moves.

## Imagery

- Use real photos of our people: the crowd playing along, the band on stage, the community group at a gig. Faces, ukuleles, the screen full of chords. No stock photos, illustrations or AI-generated images.
- A Banner photo is covered by `maroon-wash`. Photos in page content never get a tint or filter.
- Alt text says who is doing what, and where: "One of our members leading a songwriting workshop in a striped festival tent, arms wide, in front of a seated group holding ukuleles". Banner photos are backgrounds and get no alt text: the H1 carries the meaning.
- A caption is one line saying what, where and when: "Leading a play-along on the port of Monopoli, Monopolele Festival 2023".
- Use the image macros in `templates/_macros/images.html` (`content_picture` for photos, `static_picture` for logos), and the `image-set()` that `_partials/banner.html` builds for Banner photos. Both serve AVIF and WebP. Content photos are 1000px wide and 3:2.

## Logo and icons

- The logo is a white shield carrying a teal T and a teal heart, beside a white script wordmark. Because the shield and the wordmark are white, the logo only works on dark grounds: the `teal-deep` header, the `night` footer, `maroon`. There is no version for light grounds yet ([Decision 6](decisions.md)), so don't recolour it, outline it, or put it on a photo.
- On phones, the header shows the shield alone (`ut-icon-white-green-header-1`).
- The only icons are social-network logos from Simple Icons, drawn as inline SVG by `templates/_macros/social-icons.html` at 16px, coloured with `currentColor`. They're white in the header (the logo teal is too faint on `teal-deep`) and `slate` in the footer's copyright bar. There is no general UI icon set: write words instead. The Details disclosure uses the text characters + and −.

## Components

| Component | Use it for |
|---|---|
| [**Button**](components/Button.md) | The one action a section asks for. Primary (`sun`) for the main action; Light (white) for a second action on a dark ground; Small for the header's "Book us"; Block for a form's submit. At most one primary Button per section. |
| [**Banner**](components/Banner.md) | The top of every page: a photo under `maroon-wash`, the H1, and an optional subtitle. The home page uses the tall size, with the session pill and up to two Buttons. |
| [**Band**](components/Band.md) | A full-width strip of `teal` or `maroon` with one sentence, or the enquiry form, ending in the wave. At most one of each colour per page. |
| [**Prose**](components/Prose.md) | Body copy: paragraphs, H2 and H3, lists and links. |
| [**Frame**](components/Frame.md) | A photo or video in a coloured border, with an optional caption. |
| [**Callout**](components/Callout.md) | A short answer the calendar fills in (next session, next gig), and each event in the list. |
| [**Details**](components/Details.md) | Facts or FAQs someone might want but most people won't need: the "Practical details" on Book us, and FAQ answers. |
| [**Field**](components/Field.md) | A labelled form input, select or textarea. |

**Site chrome.** The header is `teal-deep`, 90px tall (60px on phones). The desktop nav is in `nav-text` (13px Quicksand, uppercase, 1px letter-spacing), next to a Small Light Button labelled "Book us". The phone menu opens on `teal` with `ink` links in 16px Poppins, in normal case ([Decision 2](decisions.md)). The promo bar sits above the header when there's news: it's `maroon`, with one sentence and one link in 14px Poppins. Empty `templates/_partials/promo_banner.html` to hide it. The footer is `night`, with `on-night` text, white uppercase headings (16px Poppins bold, 1px letter-spacing), and the copyright year generated at build time.

## Accessibility floor

- Text contrast is at least 4.5:1, or 3:1 for text 24px and larger. Focus rings, control edges and icons are at least 3:1. The pairs in the Colour table already meet this; don't invent new ones.
- Every link, button and field shows the focus ring.
- Colour never carries meaning on its own: event types have words, and errors have text.
- Nothing tappable is shorter than 40px: Buttons are `button-height` (64px), the header's is `button-height-small` (40px), and inputs are `control-height` (42px).
- CI fails if the Lighthouse accessibility score drops below 0.9. Treat that as a floor, not a target.

## Files

- [`tokens.json`](tokens.json): every colour, type style, space, radius, size and shadow, with a note on where each is used. `static/css/custom.css` declares them as CSS custom properties in `:root`.
- [`components.css`](components.css): the reference CSS for the eight components. It isn't loaded by the site yet; port a component into `custom.css` when a page first needs it.
- [`components/`](components/): one guide per component.
- [Decisions for a person](decisions.md) and [Retired](retired.md).
