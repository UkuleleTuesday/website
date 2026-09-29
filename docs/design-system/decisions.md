# Decisions for a person

These need someone who knows the group, not a style rule. Each one has a default, and the rest of this system already follows it. If you choose differently, change what "If you change it" names, and delete the item from this list.

**How the defaults were picked.** Where the site is already consistent and legible, the default keeps today's look, even where I'd choose otherwise. Where the site is inconsistent, or fails contrast, the default picks one variant and says why. "My view" appears only where I'd pick differently from the default, or where the default is a real change.

## 1. Orange: button labels and links

**Today.** Most calls to action are `sun` (#efa537) pills with white labels, and body links are orange text. Both are 2.1:1, far below the 4.5:1 WCAG minimum.

**Default here.** Keep the orange buttons and put `ink` labels on them (6.2:1). Hover still turns them `teal-deep` with a white label, as today. Links become `teal-deep` (6.9:1), and turn `maroon` on hover, as today.

**The alternative.** Make primary buttons `teal-deep` with white labels, like the home page's two hero buttons today, and keep orange for frames and event accents. Links could be `maroon` instead of `teal-deep` (12.8:1).

**If you change it:** edit Button and the base link rule in `components.css`, and the `sun` usage note.

## 2. White text on the bright teal: bands and the phone menu

**Today.** The teal Band on the Session, Songbook, WhatsApp and Code of Conduct pages, and the whole phone menu, put white text on `teal` (#1db1ad). That's 2.6:1, below even the 3:1 allowed for large text.

**Default here.** Keep the bright logo teal and set the text in `ink` (4.8:1).

**The alternative.** Switch both to `teal-deep` with white text (6.9:1). Every inner page would then run header, Banner and Band in dark colours, and the logo's bright teal would all but disappear.

**If you change it:** edit Band, the site chrome paragraph in the README, and the `teal` usage note.

## 3. Banner photos: one treatment, and does the photo stay still?

**Today.** Every inner page puts its photo under a 75% maroon wash, fixed in place, so the page scrolls over it on desktop (phones ignore this). The home hero is the odd one out: a full-colour photo that scrolls normally, with white text and a text shadow. How well that text reads depends on the photo.

**Default here.** One Banner everywhere, with the maroon wash, which keeps the white H1 above 6.7:1 on any photo. The home page's Banner is just taller. The fixed photo stays, because every inner page has it today.

**The alternative.** Keep the home photo in full colour, with a dark gradient behind the text only (this needs a new token). Separately, the fixed photo could go.

**My view:** drop the fixed photo. Most visitors are on phones, where it already does nothing, and on desktop it's a 2010s parallax effect that makes scrolling heavier.

**If you change it:** edit `.banner` and `.banner--home` in `components.css` (`background-attachment` is one line).

## 4. What do we call the Tuesday thing?

**Today.** One weekly event goes by six names: "the Play-Along Session" (nav and page title), "the Tuesday session" (the page URL, and the Contact and Songbook pages), "the jam", "the play-along", "the session" and "UT". The top-tasks review found people searching for "ukulele group dublin" and "ukulele classes dublin", and none of those words appear in the Session page's title.

**Default here.** Say "the play-along session" on first mention and "the session" after that. Use "jam" only for the jam-session offer on Book us.

**Needs:** the group's own sense of its name, checked against what people search for. This is the most visible word on the site.

**If you change it:** edit the House style table in the README.

## 5. Three typefaces, or two?

**Today.** The site uses Pattaya for H1s, Quicksand for H2s and the nav, and Poppins for everything else. Quicksand and Poppins are both rounded geometric sans-serifs. Few visitors would notice if H2s moved to Poppins 700, and the site would load one font fewer.

**Default here.** Keep all three, each with one job.

**If you change it:** point the `heading` family at Poppins in `tokens.json` and drop Quicksand from the Google Fonts URL in `base.html`.

## 6. A logo for light backgrounds

**Today.** The only logo files are white (the shield and the wordmark), so the logo can only sit on dark grounds.

**Default here.** Only use the logo on `teal-deep`, `night` or `maroon`. Don't recolour it.

**Needs:** whoever holds the original artwork, to export a version for light grounds.

## 7. Uppercase outside buttons: the nav and footer headings

**Today.** Buttons are uppercase (the form "Send" buttons were the only exception, and now follow the rest). The desktop nav and the footer headings are uppercase too, small, with 1px letter-spacing. The phone menu is in normal case.

**Default here.** Keep today's look: the desktop nav and footer headings stay uppercase and tracked, and the phone menu stays in normal case.

**The alternative.** Normal case for everything except Buttons. The header would read "Book us · Play-along session · Songbook · Support us", which is calmer and a little more current.

**If you change it:** edit the `nav-text` style in `tokens.json` and the Type rules and site chrome paragraph in the README.

## 8. Headings: sentence case or Title Case?

**Today.** Mixed. Most headings are in Title Case: every Banner ("Contact Us", "Code Of Conduct", "Our Songbooks") and the older sections ("Play Along With Us", "How To Find Us"). The Book us page, rewritten this year, and the newest part of Contact use sentence case ("Festivals and other gigs", "Tell us about your event").

**Default here.** Sentence case, following the most recent deliberate rewrites. It's also easier to apply the same way every time, with no rules about which small words stay lower case.

**The alternative.** Title Case everywhere, which is what most headings use today.

**If you change it:** edit "Headings, buttons and titles" in the README and the Copy table in Retired. Button labels aren't affected, because they're shown in uppercase either way.

## 9. Body text: grey or dark?

**Today.** Every paragraph on the site is `slate` (#6d7783), a light blue-grey. It passes on white at 4.55:1, with nothing to spare. The calendar cards and the next-session card use dark text.

**Default here.** Keep `slate` for body copy, on white only.

**The alternative.** `ink` (#293340) for body copy (12.8:1), with `slate` kept for captions and labels.

**My view:** go dark. The grey reads faintly on a phone in a dim pub, and the newer calendar components already chose dark text.

**If you change it:** point the base `body` and `.prose` colours in `components.css` at `ink`, and edit the `slate` and `ink` usage notes.

## 10. Buttons: big and raised, or compact and flat?

**Today.** The pill buttons are 64px tall, bold, with a soft shadow that drops away on hover. The form "Send" buttons are 50px, full width and flat. The header's "Book us!" is a small 40px pill.

**Default here.** Keep the 64px raised button, and bring the form submits into line with it (they stay full width). The header keeps its small button.

**The alternative.** One compact 48px flat button everywhere, which is lighter on phones.

**My view:** keep the default. I'd flattened them at first, but on the real pages the big soft pills are a large part of the site's friendly look.

**If you change it:** edit `button-height` and `shadow-button` in `tokens.json`.

## 11. Headings on phones

**Today.** Headings never shrink. On a 412px phone the H1 (60px Pattaya, 72px on the home page) wraps over three lines and fills the Banner, and a 30px Band sentence runs to five lines.

**Default here.** Keep today's sizes.

**The alternative.** Under 768px, H1s at 44px/52px and H2s and Band sentences at 24px/30px.

**My view:** shrink them. On a phone the first screen should show the answer, not three lines of the page's name.

**If you change it:** add the phone sizes to the `display` and `h2` styles in `tokens.json`, and a `max-width: 767px` rule to `components.css`.

## 12. Exclamation marks and emoji in labels

**Today.** "Book Us!" on every page, "Join Our WhatsApp Community!" as an H1, and 🏆 opening the promo bar. Most other headings and labels have neither. In body copy there's a 👋, a 😉 and a `:-)`.

**Default here.** None in headings, buttons, labels, page titles or the promo bar, which is how most of them already read, so "Book us!" loses its exclamation mark. Emoji are fine now and then in body copy; `:-)` goes.

**The alternative.** Keep "Book us!" as the site's one shouted label, and allow an emoji to open the promo bar.

**If you change it:** edit the Voice and copy list in the README.
