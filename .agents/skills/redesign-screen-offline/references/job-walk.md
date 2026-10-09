# The job walk

Six checks. Walk them as the person the job names, from arrival to done, through the target. Every break is a candidate problem.

This is method, not a source. A problem's reason is always the step of the job it blocks, never a principle quoted from a guideline.

## 1. The path leads

The eye lands on the job's first step. One primary control finishes it. Nothing off the path competes, including anything the shell around the region already does.

Break: the learner is looking at a transcript and the control that advances the turn is below the fold on a 390px phone. Blocks step one.

## 2. Every decision has its information beside it

Not a scroll away, not a tap away. The value that a choice affects sits next to the choice.

Break: the pronunciation score appears only after the turn ends, so the learner chooses a phrase without knowing how it was scored. Blocks the choice.

## 3. Nothing the job needs is missing

Every input, label and affordance the job requires is present and reachable.

Break: there is no way to skip a phrase you cannot say, so the learner is stuck. Blocks the whole job.

## 4. Every label and value is true

A control does what it says. An icon without a label is one the platform already teaches: close, share, back, or a tab it repeats. An unlabelled icon the design system uses throughout is its style, not a fault. A value shown twice reads the same, and a total matches its lines.

Break: the button says "Skip" and skips two turns. Blocks trust in every other control, so rank it high.

## 5. Every state the target enters lets the job be done, or says why not

Loading, empty, error, disabled, no-speech-detected, network loss, permission denied, session over.

Break: while the model is thinking, the mic button stays live and the learner can talk into nothing. Blocks the turn.

A state that is present but unreachable is not a fault on its own. It is built only when a ticked problem needs it.

## 6. The platform's minimums hold

Target size, the smallest text step, contrast, from this repo's own numbers in `src/design/tokens.ts`:

- `MIN_TOUCH_TARGET` is 48.
- `MIN_READABLE_PX` is 12, and `TYPE.captionSm` is the floor.
- Text and control-boundary pairings are verified by `tests/design.test.ts` against WCAG 2.2 minimums. A regression here fails the test, so it is a fail, not a note.

Break: the close control on the sheet is 32px. Blocks stopping.

## Ranking

Rank candidates by how much of the path each blocks, the user's own complaints first, in their words.

Every candidate is stated so a render could show it fixed. "The seats stepper sits below the plan choice it prices, so the price is chosen blind". "It looks dated" is not a candidate until it names the step it slows.
