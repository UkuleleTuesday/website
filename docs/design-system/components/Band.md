# Band

A full-width strip of colour that holds either one sentence or the enquiry form, and ends in the brush-stroke wave.

## Variants

- **Teal** (`.band`): the logo's `teal`, with one centred sentence in `ink` (`.band-text`, `h2` style). Use it straight after the Banner to say what the page is about in the group's own voice.
- **Maroon** (`.band band--maroon`): `maroon` with white text. On the home page it holds the tagline; on Book us it holds the enquiry form inside `.band-body` (left-aligned, `measure` wide).
- The wave goes on whichever edge meets the white page: the bottom by default, or the top with `.band--wave-top`.

## Markup

```html
<div class="band">
  <p class="band-text">Love to play uke? Love to sing? Join us upstairs at The Stag's Head, every Tuesday from 8pm.</p>
  <div class="band-wave">{% include "_partials/shape-divider.html" %}</div>
</div>
```

## You provide

- One sentence, or a heading and a form. The sentence is a `<p>`, not a heading: it's a line of voice, not a section title.

## Rules

- Use at most one Band of each colour per page.
- White text never goes on `teal` (2.6:1). The ink text on the teal Band is waiting on a decision ([Decision 2](../decisions.md)).
- Links in a maroon Band are white and underlined, and turn `sun` on hover. Form labels are white.
- `.section-teal`, `.section-maroon` and `.purple-section` are retired: they are all this component.
