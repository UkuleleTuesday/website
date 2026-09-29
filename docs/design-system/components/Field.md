# Field

A labelled form control (text input, email, select, textarea or checkbox) with an optional hint and an error message.

## Markup

```html
<label class="field">
  <span class="field-label">Your email</span>
  <input class="field-input" name="your-email" required type="email">
  <span class="field-hint">We only use it to reply.</span>
</label>

<label class="field field-check">
  <input name="accept" type="checkbox">
  <span>I agree to follow the <a href="/code-of-conduct/">Code of Conduct</a>.</span>
</label>
```

With an error, add `aria-invalid="true"` and `aria-describedby` to the control, and put a `.field-error` span after it.

## You provide

- A visible label in sentence case that names the thing: "Your name", "What are you enquiring about?". Never rely on a placeholder alone.
- Netlify Forms field names that match on every page posting to the same form (see `templates/_partials/contact_form.html`).
- An error message that says how to fix the problem, not just that something failed.

## Rules

- Inputs are white, with `radius-lg` (20px) corners as on the forms today, and are `control-height` (42px) tall. Their 1px border is `slate` (4.55:1): today's border is invisible (1.1:1).
- Labels are `slate` on white, as today, and `surface` inside a maroon Band.
- On focus, the border turns `teal-deep` and the focus ring shows. Never `outline: none`.
- The submit is a full-width primary Button (`button button--block`) labelled with what happens: "Send", "Join the WhatsApp community". Not "Submit".
- Checkboxes use `accent-color: teal-deep`.
