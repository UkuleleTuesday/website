# Banner

The top of every page: a photo under `maroon-wash`, with the page's only H1 and an optional subtitle.

## Sizes

- **Page** (`.banner`): `space-6` padding, H1 and an optional one-sentence subtitle.
- **Home** (`.banner banner--home`): at least 600px tall. Adds the session pill (`.banner-pill`, filled in by `static/js/calendar.js`) and up to two Buttons: one primary, one Light.

## Markup

```html
<section class="banner" style="--banner-photo: image-set(url('/assets/images/….avif') type('image/avif'), url('/assets/images/….webp') type('image/webp'), url('/assets/images/….jpg') type('image/jpeg'))">
  <h1>Book us</h1>
  <p class="banner-subtitle">Our band, a play-along session or a workshop, for festivals and events across Ireland and abroad.</p>
</section>
```

`_partials/banner.html` builds the `image-set()` from `banner_image_url` today. Keep passing the photo this way: it's the only inline style the system allows.

## You provide

- A landscape photo from `static/assets/images/`, in JPEG with AVIF and WebP next to it (the build makes those). It's a background, so it has no alt text: the H1 carries the meaning.
- An H1 of 2 to 5 words that says what the page is: "Book us", "The play-along session", "Code of Conduct". No greeting and no exclamation mark.
- Optionally, one subtitle sentence in `lead` style.

## Rules

- There is one Banner per page, and it's the first thing inside `<main>`.
- The photo is always under `maroon-wash`, which keeps the white H1 above 6.7:1 on any photo. No `text-shadow`.
- The photo stays fixed while the page scrolls on desktop, as it does today. Phones ignore this.
- The H1 is set in Pattaya (`display`), 60px/72px, on every page including home.
- Open decisions: the home photo's wash and the fixed photo ([Decision 3](../decisions.md)), and heading sizes on phones ([Decision 11](../decisions.md)).
