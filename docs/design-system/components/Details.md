# Details

A native `<details>` disclosure between hairlines, for facts or answers that some visitors need and most don't. Closed by default, with a + that turns into a −.

## Markup

```html
<details class="details">
  <summary>Practical details</summary>
  <dl class="facts">
    <div><dt>Set length</dt><dd>30 to 60 minutes</dd></div>
    <div><dt>Cost</dt><dd>On enquiry</dd></div>
  </dl>
</details>

<details class="details">
  <summary>Can I come if I'm under 18?</summary>
  <div class="details-body"><p>…</p></div>
</details>
```

## You provide

- A summary that names what's inside: "Practical details", or the FAQ question exactly as a visitor would ask it.
- Either a facts list (`<dl class="facts">`, labels in `slate`) or a `.details-body` with paragraphs.

## Rules

- Use it for secondary facts only. Never hide the answer a page exists to give (time, place, price) inside one.
- A long FAQ list is one Details per question. Stack them: the hairlines join up.
- The + and − are text, in `teal-deep`. No icon font or SVG.
