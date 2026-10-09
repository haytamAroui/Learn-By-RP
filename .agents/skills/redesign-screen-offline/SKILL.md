---
name: redesign-screen-offline
description: Redesign or audit a screen with evidence instead of taste. Works with no Mobbin subscription and no MCP. Every move is backed either by the source in front of you or by a named, linked decision from a shipped design system (GOV.UK, Carbon, Primer) or W3C (WCAG 2.2, ARIA APG). Builds inside LearnByRP's existing tokens and never swaps them. Use when the user points at a screen, component, or flow they have and asks to improve, fix, restyle, or rebuild it, or asks why a screen looks or behaves the way it does. Also use for a standalone UI audit or a contrast/target-size/state check.
---

# Redesign a screen offline

Work as a design lead whose every decision is traceable. You have no Mobbin account and no MCP, so you cannot cite product screenshots. You cite something better in one way and worse in another, and the difference matters:

- **Worse:** you cannot see what consumer apps actually ship. You never claim to.
- **Better:** you can cite *documented decisions* from design systems that run in production, each with a URL and a section, each stating what to do and often why. These are not opinions.

The user's own design system decides how it looks. A cited source decides what it does. Mixing those up is the one failure that matters here, because LearnByRP already has a token contract and swapping it is the expensive mistake.

## Workflow

1. **Read the source.** The component, the screen, the tokens. Read before asking anything.
2. **Write the job and walk it.** One line for the job, then the six checks.
3. **Freeze the preserve list.** Domain, tokens, copy, everything outside the target.
4. **Gather evidence.** The source first, then cited external sources per problem.
5. **Plan moves.** One per problem, each with its citations. Five at most.
6. **Apply inside the tokens.** Tokens only, no raw values.
7. **Check.** Re-walk the render. Run the repo's checks.
8. **Report.** Each change with the sources behind it.

## Read at the step that names it

| File | Read at |
|---|---|
| [references/job-walk.md](references/job-walk.md) | step 2 |
| [references/sources.md](references/sources.md) | step 4, before any fetch |
| [references/report.md](references/report.md) | step 8 |

## Ground rules

Every claim the user reads carries evidence. Only three kinds count:

1. **The source.** An element, value, position or state you read in this repo. Cite it as `file:line`.
2. **The user's words,** quoted or kept in their terms.
3. **A cited source,** named with a link to the section that makes the decision.

Never any of these:

- **No unsourced precedent.** No "most apps", "industry standard", "best practice" as a bare noun, "users expect". Either a cited source makes the claim or it is cut.
- **No memory as a source.** Do not cite Apple HIG, Material Design, or any system you have not fetched in this session. See `references/sources.md` for which of these return text and which are dead to a fetcher.
- **No sourced look.** A cited source decides **what a component does**, never its colour, typeface, radius, or copy. Those come from this repo's tokens. This is the rule that keeps the citations from dragging in someone else's brand.
- **No outcome claims.** Never say a change converts, retains, reduces friction, or is more usable. Name the decision and the step it unblocks.
- **No quality adjective without the thing behind it.** "Cluttered", "dated", "clean" appear only in the user's words or beside the part they describe.
- **Numbers only what you measured.** Sizes and contrast ratios stay in your notes. The user reads what they mean.
- **No claim the diff does not show.** If a move did not land, it is not in the report.

## 1. Read the source

LearnByRP's design system lives in `src/design/tokens.ts` and is authoritative. Read it. It is the whole palette, type scale, spacing, radius, elevation, motion, breakpoints, touch-target floor and focus-ring geometry, in both themes.

Also read, when the task touches them:

- `LEARNBYRP_DESIGN_SYSTEM_V4_TODO.md` — the active UI/UX authority
- `tests/design.test.ts` — asserts token and generated-CSS parity, and verifies text and control-boundary pairings against WCAG 2.2 contrast minimums. **A change that breaks it fails the build, by design.**
- `AGENTS.md` — Talk, Missions and Progress and the current tokens must survive.

Treat the form the user brought as the **source**: a component, a screen, a screenshot, a live route. Read it with whatever the environment offers.

## 2. Write the job and walk it

Write the **job** in one line: who arrives, what they came to do, what done looks like. From the source and the user's words only.

Then walk the path as that person through the six checks in `references/job-walk.md`. Every break is a candidate problem, and every candidate names the step it breaks: "the stop control sits under the transcript, so a learner who wants to stop scrolls past the line they are reading". "It feels cramped" is not a candidate until it names a step.

Rank candidates by how much of the path each blocks, the user's own complaints first.

## 3. Freeze the preserve list

Write down what must not change, in this order:

1. **The domain.** A language-learning app stays a language-learning app.
2. **Tokens and theme.** `src/design/tokens.ts` is never edited to fit a move. Both themes keep the same shape: a token missing from one theme is a type error, and the type is the point.
3. **Copy and data.** The screen keeps its own words and its own language content. A label is written in this product's terms.
4. **Everything outside the target.** When the target is one component, the rest of the screen does not change.
5. **What already works,** named, where changing it costs more than it gains.

Note this codebase's own recorded findings, which are the highest-quality sources available and cost nothing to cite:

- `captionSm` at 12px is the floor. Sub-12px text is the most common way a clean design turns unreadable on a phone.
- Touch targets are 48, not 44. Both platforms treat 48 as the comfortable minimum.
- The focus ring is drawn against the **background** with a 2px offset, never flush against a filled control. Flush cases use `focusOnBrand`.
- Canvas is deliberately not white, so a card can separate by shadow rather than tone.

## 4. Gather evidence

Evidence is gathered in this order, and the first two never need a fetch.

**From the source.** Read the code. Most problems here are already answered by a token or a comment in `tokens.ts` explaining why a value is what it is. Cite `file:line`.

**From the repo's own tests and docs.** `tests/design.test.ts` and the V4 doc are cited sources for anything they already assert.

**From external sources**, only for what the first two cannot settle. Read `references/sources.md` first, then fetch. Rules:

- One fetch per question, not a bulk download. Fetch only the component or pattern in play.
- Cite the **section**, not the site: `Carbon — Button › Emphasis`, not "the Carbon docs".
- **Two independent systems agreeing is a precedent.** One is an example. Neither is your judgement, which fills the parts a source does not show and is labelled as such when the user reads it.
- Where systems **disagree**, that is a real finding, not a problem to smooth over. Resolve it in favour of this repo's existing tokens, and say which side you took and what you left. Carbon and GOV.UK genuinely disagree on primary-button alignment in progressive forms; both are defensible and the tokens decide.

If a fetch returns a JavaScript shell with no content, the source is dead to a fetcher. Say so in one line, drop that source, and settle the question from the source or the tokens. Never cite a page you did not read.

## 5. Plan moves

A **move** fixes one problem with a decision a source shows. One per problem, **five at most**, ranked by how much of the job each unblocks.

Each move records: the problem, the step it breaks, its **citations** (source file:line, or linked external section), what it adds, what it removes.

- **Cite the decision, not the element.** A move that adds a visible stop control needs a source about stop and cancellation affordances, not one about icon buttons.
- **No source, no move.** Judgement fills placement and wording, never the whole move.
- **Contrast and target size are not moves.** They are gates. A value that fails WCAG is fixed, not debated, and does not consume one of the five.

Cut a move that removes content the baseline had, moves content off the screen, adds a stock detail with no named problem, or does something no cited source does and no token supports.

## 6. Apply inside the tokens

Hard rules. These are not preferences.

- **Tokens only.** No raw hex, no one-off spacing, no value off the `SPACE`, `RADIUS` or `TYPE` scale. A new token is a change to the design system and needs its own decision, not a side effect of a move.
- **Both themes.** `LIGHT` and `DARK` keep the same shape. Forgetting one is a type error; that is the design working.
- **No new dependencies.** No icon set, typeface, or library introduced by a move.
- **Keep interactions real.** A control drives real state. Wire nothing no move asked for.
- **Use the existing test.** Run `npm run typecheck` and `npm test`. `tests/design.test.ts` is the token and contrast gate; a move that trips it is wrong, not the test.

## 7. Check the render

Before reporting, re-walk the render through the six checks, plus three for the render alone:

- only states a move made reachable are rendered;
- nothing outside the target moved;
- nothing came from outside the token file.

Each check passes or fails. Fix a fail inside the target and the preserve list, then run every check again. Three rounds at most. A fail still standing after the third round cuts its move.

Then run the checks the environment has and fix what they report. A contrast or target-size regression is a fail, not a note.

## 8. Report

Write the report as `references/report.md` sets out.

## Scope

Two modes, set by `--audit` or `--build`, or asked at the first question when neither is given:

- **Audit** (`--audit`): walk the checks, report the problems with their citations and the job step each breaks. Nothing is changed. This is the mode to reach for when the user asks what is wrong.
- **Build** (`--build`): the full workflow, ending in edits to the source.
