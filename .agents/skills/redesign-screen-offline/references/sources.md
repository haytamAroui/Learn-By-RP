# Sources

The offline catalogue. Everything here was checked on 2026-10-09 for whether a plain fetch returns readable text.

## What returns text, and what does not

This is the single most important thing in this file. A page that renders client-side returns a JavaScript shell with no content, and a shell is not a source. Never cite one.

| Source | Base URL | Status |
|---|---|---|
| GOV.UK Design System | `https://design-system.service.gov.uk/components/<component>/` | Returns full text |
| Carbon Design System | `https://carbondesignsystem.com/components/<component>/usage/` | Returns full text |
| Primer (GitHub) | `https://primer.style/product/components/<component>/` | Returns full text |
| WCAG 2.2 Understanding | `https://www.w3.org/WAI/WCAG22/Understanding/<criterion>.html` | Returns full text |
| ARIA Authoring Practices | `https://www.w3.org/WAI/ARIA/apg/patterns/<pattern>/` | Returns full text |
| Apple HIG | `https://developer.apple.com/design/human-interface-guidelines/<component>` | **Dead to a fetcher.** JS-only. Do not cite. |
| Material 2 / 3 | `https://m2.material.io/...`, `https://m3.material.io/...` | **Dead to a fetcher.** JS-only. Do not cite. |

Apple and Material are the two most-cited design systems in existence and both are unreachable here. Do not cite them from memory either. When a question would be answered by Apple's 44pt target guidance, use `MIN_TOUCH_TARGET` from `tokens.ts` instead, which is this repo's own recorded answer.

If a page from a working base returns a shell anyway, the component slug is probably wrong. Check the site's component index rather than guessing a second slug.

## GOV.UK Design System

Public sector, plain, heavily researched, and unusually explicit about what not to do. Strongest single source for forms, error handling and content.

| Topic | URL |
|---|---|
| Button | `/components/button/` |
| Text input | `/components/text-input/` |
| Radios | `/components/radios/` |
| Checkboxes | `/components/checkboxes/` |
| Select | `/components/select/` |
| Error message | `/components/error-message/` |
| Error summary | `/components/error-summary/` |
| Notification banner | `/components/notification-banner/` |
| Tabs | `/components/tabs/` |
| Accordion | `/components/accordion/` |
| Pagination | `/components/pagination/` |
| Summary list | `/components/summary-list/` |
| Back link | `/components/back-link/` |
| Character count | `/components/character-count/` |
| Skip link | `/components/skip-link/` |
| Radios and checkboxes sizing | see `/components/radios/` for the do-not-shrink guidance |

Cite the section, e.g. `GOV.UK — Button › Disabled buttons`. Its contrast and target-size reasoning cites WCAG directly, which makes it a good bridge source.

## Carbon Design System

IBM's system. The most detailed source here on **emphasis, alignment and grouping** — it tabulates which combinations of variants to use and which to avoid, which is exactly the kind of decision a design move needs.

| Topic | URL |
|---|---|
| Button | `/components/button/usage/` |
| Button specs | `/components/button/specifications/` |
| Link | `/components/link/` |
| Text input | `/components/text-input/` |
| Checkbox | `/components/checkbox/` |
| Radio | `/components/radio/` |
| Toggle | `/components/toggle/` |
| Tabs | `/components/tabs/` |
| Modal | `/components/modal/` |
| Notification | `/components/notification/` |
| Progress bar | `/components/progress-bar/` |
| Tag | `/components/tag/` |
| Tooltip | `/components/tooltip/` |
| Content switcher | `/components/content-switcher/` |
| Empty states (pattern) | `/patterns/empty-states/` |
| Disabled states (pattern) | `/patterns/disabled-states/` |
| Loading (pattern) | `/patterns/loading/` |
| Dialogs (pattern) | `/patterns/dialogs/` |
| Status indicators (pattern) | `/patterns/status-indicators/` |
| Spacing scale | `/building-blocks/foundations/spacing/` |
| Typography | `/building-blocks/foundations/typography/` |
| 2x grid | `/building-blocks/foundations/2x-grid/` |
| Motion | `/building-blocks/foundations/motion/` |
| Accessibility | `/building-blocks/foundations/accessibility/` |
| Colour | `/building-blocks/foundations/color/` |

The foundations paths sit under `/building-blocks/foundations/`, not `/foundations/`. The short form 404s.

Its `/usage/` pages carry **do / do-not image pairs**, which is the closest thing to a screenshot comparison available offline. Cite the guidance text, not the image filename.

Where Carbon disagrees with GOV.UK, both are cited and the tokens decide. Their known disagreement: alignment of the primary button in progressive forms. Carbon puts it bottom-right in wizards, GOV.UK left-aligns in-page forms and uses a start button at the top of the first page. Neither is wrong. A single-screen mobile app in this repo is closer to GOV.UK's form case.

## Primer (GitHub)

Modern, product-UI shaped, and the best of the three for **loading, inactive and destructive** states. Its `loading` and `inactive` props are notable: `inactive` is visually disabled but still focusable and still activatable, which is a real distinction for a control that must explain why it is unavailable.

| Topic | URL |
|---|---|
| Button | `/product/components/button/` |
| Button guidelines | `/product/components/button/guidelines/` |
| Button accessibility | `/product/components/button/accessibility/` |
| Dialog | `/product/components/dialog/` |
| ConfirmationDialog | `/product/components/confirmation-dialog/` |
| Banner | `/product/components/banner/` |
| InlineMessage | `/product/components/inline-message/` |
| TextInput | `/product/components/text-input/` |
| FormControl | `/product/components/form-control/` |
| Select | `/product/components/select/` |
| ToggleSwitch | `/product/components/toggle-switch/` |
| Spinner | `/product/components/spinner/` |
| Skeleton | `/product/components/skeleton-text/` |
| ProgressBar | `/product/components/progress-bar/` |
| Label | `/product/components/label/` |
| Empty states (pattern) | `/product/ui-patterns/empty-states/` |
| Notification messaging | `/product/ui-patterns/notification-messaging/` |
| Saving (pattern) | `/product/ui-patterns/saving/` |
| Responsive | `/product/getting-started/foundations/responsive/` |

Primer's rule to **avoid disabling buttons** because it strands keyboard users is worth citing whenever a control is greyed out.

## WCAG 2.2

The gate, not the aesthetic. Cite a criterion when a value either passes or fails, never when you merely prefer it.

| Criterion | Slug | Relevance here |
|---|---|---|
| 1.4.3 Contrast (Minimum), AA | `contrast-minimum` | Text and control boundaries. Enforced by `tests/design.test.ts`. |
| 1.4.11 Non-text Contrast, AA | `non-text-contrast` | The 3:1 on interactive borders and focus indicators |
| 1.4.1 Use of Color | `use-of-color` | Colour must not be the only channel. Live in this product. |
| 2.5.8 Target Size (Minimum), AA | `target-size-minimum` | 24px floor, with a spacing exception. This repo uses 48. |
| 2.5.5 Target Size (Enhanced), AAA | `target-size-enhanced` | 44px. The reason `MIN_TOUCH_TARGET` is 48. |
| 2.1.2 No Keyboard Trap | `no-keyboard-trap` | Any overlay, sheet or modal |
| 3.3.1 Error Identification | `error-identification` | Labelled errors, not colour alone |
| 3.3.2 Labels or Instructions | `labels-or-instructions` | Form field labelling |
| 2.2.1 Timing Adjustable | `timing-adjustable` | Live speaking sessions. Directly relevant. |
| 2.5.3 Label in Name | `label-in-name` | Accessible name must contain the visible label |
| 2.5.8 motion, animation | see `animation-from-interactions` | `MOTION` durations |

For this product, `timing-adjustable` is the one worth reading before touching the live session: a timed speaking turn needs a way to extend or stop it.

## ARIA Authoring Practices

Behaviour and keyboard interaction for patterns, not visual design. Cite when a move adds or changes an overlay, a menu, or a custom control.

| Pattern | Slug |
|---|---|
| Dialog (Modal) | `dialog-modal` |
| Alert Dialog | `alertdialog` |
| Disclosure | `disclosure` |
| Tabs | `tabs` |
| Accordion | `accordion` |
| Tooltip | `tooltip` |
| Menu Button | `menu-button` |
| Combobox | `combobox` |
| Meter | `meter` |
| Radio Group | `radio` |
| Switch | `switch` |
| Slider | `slider` |

**There is no APG progress-bar pattern.** APG does not cover `progressbar`; the role is defined in the ARIA spec instead, at `https://www.w3.org/TR/wai-aria-1.2/#progressbar`. For how to use a progress bar, cite Primer's `/product/components/progress-bar/`.
| Tabs | `tabs` |

The dialog pattern's focus-return and focus-trap rules are the ones most often broken. Its note on `aria-modal` is worth heeding: mark a dialog modal **only** when code blocks outside interaction *and* styling obscures it. A React Native `Modal` usually does both, but verify.

## Sources in this repo

Free, fast, and authoritative for this product. Prefer these over any external source.

| What | Where |
|---|---|
| Palette, type, spacing, radius, motion, targets, focus geometry | `src/design/tokens.ts` |
| Contrast and token parity assertions | `tests/design.test.ts` |
| The active UI/UX authority | `LEARNBYRP_DESIGN_SYSTEM_V4_TODO.md` |
| Product invariants | `AGENTS.md` |
| Generated CSS that must match the tokens | `src/design/global.css` or wherever `cssVariables` output lands |

Cite these as `file:line`. They outrank every external source, because they are the actual contract being held to.
