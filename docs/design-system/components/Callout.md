# Callout

A short, tinted card with a coloured left edge that gives a factual answer: the next session, the next gig, or one event in the calendar list.

## Variants

The left edge says the event type:

| Class | Edge | For |
|---|---|---|
| `.callout callout--play-along` | `sun` | the next session; `#jam` and `#playalong` events |
| `.callout callout--concert` | `maroon` | the next gig; `#concert` events |
| `.callout` | `teal` | any other event |

In the calendar list, the background is `surface-soft`. The two answer cards (next session and next gig) add `.callout--highlight`, which tints them `sun-tint` or `maroon-tint`, as today.

## Markup

```html
<p class="callout callout--play-along callout--highlight" data-next-session data-format="long">
  <strong class="callout-title">Every Tuesday from 8pm</strong>
  <span class="callout-detail">Upstairs at The Stag's Head · Free · All levels welcome</span>
</p>
```

In the event list, add `.callout-meta` for the date above the title, and `role="button" tabindex="0"` when the card expands to show a description.

## You provide

- Built-in text that's true without the calendar ("Every Tuesday from 8pm"). `static/js/calendar.js` swaps in the live answer, so the card must keep the same height either way.
- The event type as a word next to the colour: the calendar legend, or the type in `.callout-detail`.

## Rules

- A Callout states facts. No jokes, no Buttons inside.
- Text is always `ink`, never `slate`: slate is too faint on a tint or `surface-soft`.
- `.next-session`, `.next-gig` and `.calendar-event` are retired: they are all this component.
