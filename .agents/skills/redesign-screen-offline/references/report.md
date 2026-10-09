# The report

Write the report under the `plain-writing` skill. It keeps the structure set here: the section headings, and each entry's short bold lead-in, which is the only bold in the entries.

## Length and order

The report is text, under any screenshot, never a file. The image already shows each change, so the text names it and points at the evidence. Cap 120 words for up to three moves, plus 25 each beyond. Over the cap, shorten the explainers first.

In order: file links, **Changes**, **Unchanged**, the Degraded line when there is one, then the closing menu. No Scope line, no reasons for what stayed.

```
**Changes**

1. **The stop control is always reachable.** It now sits in the sheet header instead of below the transcript, so a learner can stop without scrolling past the line they are reading.
   Sources: [WCAG 2.5.5 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) · `src/design/tokens.ts:272`
2. **The lead-in.** The one sentence.
   Sources: [Carbon — Button › Emphasis](https://carbondesignsystem.com/components/button/usage/)

**Unchanged**

Part, part and part.
```

Headings are bold lines, never markdown headings.

## Changes

One numbered entry per ticked problem, in problem-list order. Each has three parts:

1. **A bold lead-in** naming the new behaviour in plain interface terms ("One button finishes setup."), never the problem, so the lead-ins alone read as the list.
2. **One sentence** on what changed and what the person on screen now gets from it. Claim no more than a reader can see. Mark new copy as new.
3. **A Sources line** under it: `Sources:` then the citations, separated by ` · `.

Citation forms:

| Kind | Form |
|---|---|
| External | `[System — Section](url)` |
| This repo | `` `src/design/tokens.ts:272` `` |
| The user's own words | quoted in the sentence |

Before writing a Sources line, check each citation actually makes the decision the sentence names. Take off any that does not. When none is left, the move had no evidence: cut it from the render, re-check, and report it under its problem as one that stayed.

A problem whose move was cut keeps its entry: led by the problem in the user's words, one sentence saying it stayed and why, and no Sources line.

## Unchanged

The parts of the screen deliberately left alone, by name. This is not filler. It is what tells the user the redesign stayed inside the target, and it is the line that proves the tokens were not swapped for someone else's palette.

## Degraded

A run that lost a leg says so. After **Unchanged**, add one plain line led by **Degraded.**, naming the leg, when:

- `plain-writing` could not be invoked;
- a cited source could not be fetched, or returned a JavaScript shell with no content;
- a fetched source was dropped because it did not settle the question it was fetched for;
- a move ran on judgement alone with no source behind any part of it;
- the taken evidence was a single source where two were needed for a precedent claim;
- `npm run typecheck` or `npm test` could not be run.

A degraded run that does not say so has misreported.

## What to say about the sources

When an external source settled a decision, name it plainly in the entry. When the tokens settled it, the citation is the token file and the user recognises their own system.

Never claim a source shows a look. These systems document what a component **does**. A citation behind an entry means the behaviour is documented, not that the appearance is copied.

## Closing menu

Two or three bullets, each led in bold by what the user gets, phrased as something they can ask for next. Never name a skill.
