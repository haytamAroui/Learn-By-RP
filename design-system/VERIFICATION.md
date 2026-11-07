# Token foundation verification

Checked 24 October 2026 against this local package in Chromium.

## Current source-based reference

The initial reconstructed Home/Speaking/Exercise preview was replaced after user
feedback. The primary reference now generates the actual Home/Speaking/Progress
gallery and its first three style layers from the original `index.html`.
Selected source component literals map to 24 additional `original-*` tokens.

Current validation: 151 active token names, theme parity, generated token CSS/JS
and all 46 generic semantic text-color pairs pass. These contrast checks apply
to the generic semantic roles, not all source reference pixels or original small
captions. The source retains its original bright mic, gradients and type.

Chromium checked the source reference at 1500px, 390px and 320px in light/dark.
The page and source reference had no horizontal document overflow in those six
configurations. At desktop all three phones retain 384×904px geometry. Visual
inspection confirmed Original Home, complete Speaking dock and Progress layout.
The exercise is a separate expandable extension; its selection/Check feedback
was rechecked. Dark preview synchronizes into the reference iframe. Token text
now applies only to the documentation; it does not alter source proportions.

Current source capture: `preview-originals.png` (also `preview-context.png`).

## Previous component exploration checks

The checks below describe the superseded reconstructed specimens, not a claim
that the source reference has their typography or larger-text behavior.

## Structural and color checks

`python design-system/validate.py` passes:

- 127 active token names; light and dark role sets match.
- Token aliases resolve without cycles or missing names.
- Generated CSS and preview data match `tokens.json`.
- Component token references resolve.
- 46 supported text foreground/background pairs meet 4.5:1.
- Lowest tested pair: light speaking ink / speaking soft, 4.80:1.

These pair checks do not measure arbitrary illustration pixels, alpha-composited
glass, media overlays, every possible token combination or full WCAG conformance.

## Browser checks

- Desktop 1440px, phone 390px and narrow phone 320px.
- Both light/dark themes at normal and 125% text: 12 configurations.
- No horizontal overflow in the page or specimen scroll regions after repair.
- Theme control updates the rendered theme and active token values.
- Larger-text control scales rem-based text and spacing.
- All referenced illustrations load; bundled heading and body fonts load.
- Check answer starts disabled, enables after selection, and gives explanatory
  retry feedback for `suis` and success feedback for `voudrais`.
- Token search for `speaking` returns its three semantic roles.
- Browser console reports no errors or warnings on the reference page.

Visual inspection covered the three desktop specimens and the dark mobile Home.
The initial larger-text overflow came from the elevation specimen's intrinsic
minimum width; allowing that row to wrap and its grid item to shrink fixed it.
The Home vocabulary label was shortened to “Words” to avoid breaking the word
across lines on narrow phones. Larger content can scroll above fixed actions.

Saved reference captures: `preview-context.png` and `preview-dark-mobile.png`.

## Boundaries

This is a design-token reference, not a learning or recording engine. No backend,
microphone, learner progress or production migration was tested. Full keyboard,
screen-reader, native device, 200% zoom, cross-browser, and learner usability
validation remain outside this pass. The 142-screen Studio was not restyled.
