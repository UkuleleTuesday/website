# Frame

A photo or video in a thick coloured border with rounded corners, with an optional one-line caption. The site's most recognisable shape.

## Variants

- `.frame`: `teal-deep` (colour one)
- `.frame frame--maroon`: colour two
- `.frame frame--sun`: colour three

Rotate the colours down the page in that order. Two neighbouring frames never share a colour.

## Markup

```html
<figure class="frame frame--maroon">
  <div class="frame-media">{{ content_picture("Ukulele-Tuesday-community-group-Darkness-Into-Light", "Ukulele Tuesday's community group, about twenty people with ukuleles, in front of a lit gazebo at dawn in Marlay Park", 667, "(max-width: 767px) 100vw, 555px") }}</div>
  <figcaption>The community group playing for Pieta's Darkness Into Light walk at dawn in Marlay Park, 2025</figcaption>
</figure>
```

For a video, put `youtube_video(...)` (from `templates/_macros/video.html`) inside `.frame-media`.

## You provide

- A photo of our people (see Imagery), 3:2 and 1000px wide, with alt text that says who is doing what and where.
- Optionally, a caption: one line saying what, where and when.

## Rules

- The border is always `frame-width` (15px), and the corners are `radius-md`.
- Frame photos and videos only. Maps, the Spotify player and logos stay unframed.
- No shadow, tint or filter on the photo.
