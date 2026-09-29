# Button

A big, softly raised pill that asks for the one action a section is about. The CSS shows its label in uppercase.

## Variants

- **Primary** (`.button`): a `sun` fill with an `ink` label, `button-height` (64px) tall, with `shadow-button`. On hover it turns `teal-deep` with a white label and the shadow drops away. Use it for the main action, on any ground.
- **Light** (`.button button--light`): a `surface` fill with a `slate` label. On hover it turns `maroon` with a white label. Use it only on dark grounds, for a second action beside a primary (in the Banner or a maroon Band).
- **Small** (`.button button--light button--small`): 40px, 13px with 1px letter-spacing, no shadow. Only for the header's "Book us".
- **Block** (add `.button--block`): full width. Use it for a form's submit.

## Markup

```html
<a class="button" href="/songbook/">Open the songbook</a>
<button class="button button--block" type="submit">Send</button>

<div class="button-row">
  <a class="button" href="…">Open the songbook</a>
  <a class="button button--light" href="…">What to expect</a>
</div>
```

## You provide

- The label, typed in sentence case (the CSS uppercases it): a verb plus a thing, 1 to 5 words, with no arrow and no exclamation mark.
- An `<a>` if the button goes somewhere, a `<button>` if it submits a form.

## Rules

- Use at most one primary Button per section. The home Banner has one primary and one Light.
- A `.button-row` stacks its Buttons on phones (under 768px).
- Open links in the same tab unless they leave the site.
- Hover and focus live in CSS. Never add `style=""`, `onmouseenter` or `onmouseleave`.
- Open decisions: the label colour on `sun` ([Decision 1](../decisions.md)), and the size and shadow ([Decision 10](../decisions.md)).
