# Retired: don't copy

You'll still find everything below in the templates and CSS. It's either the old WordPress theme or a one-off fix. Don't copy any of it into new work. When you touch a page for another reason, replace what you find there.

## Colours

| Found in the code | Use instead |
|---|---|
| `#006860` (body background), `#1db1ac`, `#1eb0ad` | `teal-deep` or `teal` |
| `#1dc4b3` (header social icons) | `surface` (white) icons |
| `#333`, `#555`, `#1f2933`, `#0d0d0d`, `#2c2c2c` | `ink` |
| `#666`, `#666666`, `#878c93` | `slate` |
| `#f0f0f0`, `#f7f7f7`, `#f7f9fb` | `surface-soft` |
| `#ddd`, `#ebebeb` | `line` |
| `#191a1b` (footer copyright bar) | `night` |
| `rgba(255, 255, 255, 0.92)` (session pill) | `surface` |
| Orange (`#efa537`) as a link or text colour | `teal-deep` links |
| White text on `#efa537` or `#1db1ad` (buttons, teal bands, the phone menu) | `ink` text (Decisions 1 and 2) |
| `#edf0f7` input borders (1.1:1, invisible) | `slate` borders |
| `"Open Sans"` in `main.css` | Poppins |

## Components

| Found in the code | Use instead |
|---|---|
| `.rev-btn`; `.btn.btn-lg` with inline `style` and `onmouseenter`/`onmouseleave`; `.header-book-btn`; `.header-cta`; `.contact-form-btn` submit styles (`text-transform: none`, 50px, flat) | Button (`button--block` for form submits) |
| The inline `<style>` blocks on Book us and Contact that round the inputs and the submit | Field and Button |
| `.hero-banner` with an inline-styled H1, `text-shadow` and an untinted photo | Banner (`banner--home`, Decision 3) |
| `.section-teal`, `.section-maroon`, `.purple-section` (the same band written three times) | Band |
| An `<h2>` holding a slogan in a band | a `<p>` in a Band |
| `.img-border-green`, `.img-border-maroon`, `.img-border-yellow`, `.youtube-embed`, `.image-border-grey` | Frame |
| `.next-session`, `.next-gig`, `.calendar-event` (one idea written three ways) | Callout |
| `.offer-details`, `.offer-facts` | Details |
| `.testimonial-box` (unused) | nothing |
| `h5` styles | H3 |
| An inline-styled `<h2>` used as a sub-heading (Contact page) | H3 |

## Values and habits

| Found in the code | Use instead |
|---|---|
| Capitals typed into a template ("Book Us for Your Event", "BOOK US") | sentence case in the template; the CSS uppercases Buttons, the nav and footer headings |
| Radii of 2, 5, 12, 30 and 74px | `radius-sm`, `radius-md`, `radius-lg`, `radius-pill` |
| Shadows `2px 2px 6px rgba(0,0,0,0.2)` (hero buttons, session pill) and `0 0 8px …` | `shadow-button` on Buttons, `shadow-raised` on the pill |
| The 520px breakpoint for stacking hero buttons | 768px, like everything else |
| `.mt-15`, `.mt-25`, `.mb-25`, `.mb-55`, `.spacer` divs, inline `margin-*:0px` | spacing tokens in `custom.css` |
| Inline `style="text-align: left; letter-spacing:0px"` on headings | nothing: left alignment is the default |
| Font sizes of 12, 17, 20 and 36px, and the home H1's 72px | the type styles |
| `outline: none` on buttons and inputs (in `main.css`) | the focus ring |
| `data-max_size`, `data-min_size`, `data-vc-*`, `wpbsctn`, `post-NN` classes, `no no no` | leave them out of new markup (WordPress leftovers) |
| `lang="en-US"` on the contact form | en-GB, like the rest of the site |

## Copy

| Found on the site | Write instead |
|---|---|
| "Book Us!", "Join Our WhatsApp Community!" | "Book us", "Join our WhatsApp community" (Decisions 8 and 12) |
| "Get In touch", "View Songbook", "Download songbooks", "Read More →" | a verb plus a thing that says where the button goes |
| "Join the Session →", "Book Us for Your Event →" | "Join the session", "Book us for your event" |
| Title Case headings ("How To Find Us", "Code Of Conduct") | sentence case ("How to find us", "Code of Conduct"), per Decision 8 |
| "8 PM", "7:45 PM", "20:00 to 22:30" | "8pm", "7:45pm", "8pm to 10:30pm" |
| "Stags Head", "The Stags Head" | "The Stag's Head" |
| "Whatsapp" | "WhatsApp" |
| "50 euros" | "€50" |
| 🏆 in the promo bar, `:-)` in the FAQ | words (Decision 12) |
| "© 2022 Ukulele Tuesday." | the current year, generated at build time |

## Where this came from

Built from `UkuleleTuesday/website` at `fe695fd` (29 September 2026): `static/css/main.css`, `static/css/custom.css`, every template, the visual regression baselines in `tests/snapshots.spec.ts-snapshots/`, the README's Purpose section and the top-tasks review. The token values are the site's own. Where the site was consistent and legible, its look was kept; near-duplicates were folded together. Not carried over: the theme's unused shortcode styles, the legacy 12-column float grid, and the dark contact-form variant (no page uses it).
