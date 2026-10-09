# Conversation screenshot implementation

Visual source: the user-supplied `codex-clipboard-3ae002f2-6d39-478a-9f50-2b0b854818f6.png`.
The screenshot sets visual direction; its demo dialogue and 1/4 indicator are not
runtime scene truth. Existing authored mission content supplies suggested answers.

Implemented: café backdrop; character-specific avatar; actor and learner bubbles;
inline translation with existing support instrumentation; replay; collapsible
authored replies with separate listening and draft insertion; reducer checkpoint
progress; speaking, typing, help, stopping; options with pause/resume and slow replay.
The answer panel starts closed, including on a new attempt. Current drafts and
archive turns stay in the existing runtime. Audio retains the configured speech
provider, locale, and authored gender, with a guard against stale output.

## Generated assets

Both assets were produced with the built-in image-generation tool and copied into
the repository. They depict a fictional character and setting, with no real-person
identity or location claim. Original generator outputs were retained.

- `D:/learnbyRP/src/assets/session/lotte.png`
- `D:/learnbyRP/src/assets/session/cafe.png`

Portrait prompt:

> Generate a photorealistic editorial portrait asset for an adult Belgian-Dutch learning app: fictional friendly woman barista Lotte, early thirties, shoulder-length brown hair, natural smile, charcoal café apron, shoulders and head framed close, face centered with generous headroom. Warm Brussels neighborhood café background softly blurred, pendant lamps and plants, natural warm daylight. Square image. No text, no logos, no UI. Natural believable skin and clothing; calm, professional, approachable. Save asset for project.

Backdrop prompt:

> Photorealistic vertical background photo for an adult language roleplay mobile screen. Warm Brussels neighborhood coffee shop interior, softly blurred oak counter, pendant lamps with warm bokeh, a little green plant on left, daylight from windows. Camera looking into the café, no people, no text, no logos, no UI. Quiet cream tan tones, out of focus so overlay conversation cards dominate. Tall portrait image.

## Verification

Final run: `npm run typecheck` passed; `npm test` reports 883 passed and 3 skipped;
web export passed; the 10 interaction/recovery tests and 6 live-route visual checks
passed across light/dark themes. DESIGN.md lint reports zero errors and warnings.

- Type checking, web export, deterministic scene validation passed.
- Unit tests cover authored checkpoint counts, invalid/unscoped checkpoints,
  missing translations, exact phrase support scope, and delayed audio ownership.
- Browser tests exercise real session creation, support persistence before reveal,
  keyboard disclosure, draft insertion without submission, a successful mocked
  actor reply through the HTTP fallback, inline translation, pause/resume, and
  retained transcript after stopping. EN/FR/NL narrow layouts and reduced motion
  are exercised. Speech tests use a valid silent PCM fixture to test the adapter,
  female nl-BE request settings, replay, and support bookkeeping without paid calls.
- The preexisting 320px large-text provider-failure/recovery test remains green.
- Visual baselines for the live route are refreshed at 390/840/1440 in both themes.
- `conversation-audit.json` preserves the strict scanner's 58 findings. They are
  the known React Native `Button onPress` false positives described in
  `AUDIT_NOTES.md`; the scanner is not reported as passing.

No live provider audition, physical-device validation, hosted deployment, or
qualified human linguistic/visual review is claimed by these checks.
