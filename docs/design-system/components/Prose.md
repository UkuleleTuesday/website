# Prose

The default for body copy: H2 and H3 headings, an optional lead line, paragraphs, lists and links, in one column no wider than `measure`.

## Markup

```html
<div class="prose">
  <h2>Play along with us</h2>
  <p class="lead">Free, every Tuesday from 8pm, upstairs at The Stag's Head.</p>
  <p>Bring your ukulele (or borrow one of ours)… <a href="/songbook/">the songbook</a>…</p>
  <h3>Can I borrow a ukulele?</h3>
  <p>…</p>
</div>
```

## You provide

- Copy that follows the Voice and copy rules: the facts first, then the charm.

## Rules

- H2 for sections, H3 for points inside them. Headings are left-aligned, literal and in sentence case.
- Body copy is `slate`, 15px/24px Poppins, on white only ([Decision 9](../decisions.md)). Headings are `ink`.
- Links are `teal-deep` and underlined, and turn `maroon` on hover. Link text names where the link goes.
- Use `.lead` at most once, for a page's opening line.
- No inline `text-align`, `letter-spacing` or font sizes.
