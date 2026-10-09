---
version: alpha
name: LearnByRP
description: Adult Belgian Dutch practice using the supplied Lingo 2027 visual reference.
colors:
  primary: "#07454B"
  canvas: "#F8F3E8"
  surface: "#FFFFFF"
  ink: "#0C2B2E"
  language: "#0A726C"
  speaking: "#B5412F"
  success: "#21664C"
  warning: "#855818"
  lilac: "#65509D"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "32px"
    lineHeight: "38px"
  sans:
    fontFamily: "Figtree, system-ui, sans-serif"
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "15px"
    lineHeight: "22px"
rounded:
  control: "20px"
  card: "26px"
  hero: "28px"
spacing:
  page: "20px"
  section: "24px"
components:
  button:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    height: "48px"
    rounded: "999px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "26px"
  tabbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.language}"
    height: "68px"
    rounded: "31px"
  page:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
  speaking-card:
    backgroundColor: "#FFEAE2"
    textColor: "{colors.speaking}"
    rounded: "24px"
  review-card:
    backgroundColor: "#E3F5EE"
    textColor: "{colors.success}"
    rounded: "24px"
  progress-card:
    backgroundColor: "#EFEAFF"
    textColor: "{colors.lilac}"
    rounded: "24px"
  review-due-badge:
    backgroundColor: "#FFF1DC"
    textColor: "{colors.warning}"
    rounded: "999px"
---

# LearnByRP design system

## Overview

The active user-selected visual source is
`C:/Users/hayta_o4yzgf5/Downloads/Lingo – language app, 2027 design.html`.
It supersedes the earlier Taalbad HTML and conversation screenshot for visual
presentation. The user requested application across the complete app. Preserve
LearnByRP's learning/runtime contracts, Belgian Dutch practice, EN/FR/NL interface,
and Talk / Missions / Progress navigation.

The reference lock is warm paper, deep teal ink/actions, coral speaking controls,
lime lesson CTA, pastel practice tiles, Bricolage Grotesque headings, Figtree body
copy, vector scenery, soft shadows, tonal conversation bubbles, a compact scene
strip, a circular microphone, and floating rounded navigation. Refero live research
returned NO_SUBSCRIPTION; the supplied HTML and installed craft guidance ground
this implementation. Source demonstration scripts, mock metrics, phone bezels,
status bars, and pretend profile names are not executable product content.

## Colors

`src/design/tokens.ts` remains canonical. Warm canvas #F8F3E8 and white surfaces
carry ink #0C2B2E; primary actions use #07454B. Teal, coral, lime, lilac, and
pastel backgrounds keep the source roles. Text shades and actual input boundaries
are darkened where the reference misses the app's contrast floor. White microphone
icons meet the non-text contrast gate on coral; coral is not used for small white
button labels. Lime CTA labels use #17310F. Dark mode adapts the same hierarchy to
forest surfaces. Category colors do not establish learning evidence.

Mapping: tokens.ts → generate-css.mts → global.css and tailwind-colors.generated.json
→ NativeWind. Native consumes cssVariables through ThemeProvider; iconColor and
the router's navigation theme consume the same tokens. No parallel theme engine.

## Typography

`AppText` owns all learner-facing Text typography across routes and shared widgets.
Web requests Bricolage Grotesque (600–800) and Figtree (400–800) using the exact
Google Fonts stylesheet from the reference through Expo Router Head. Readable
platform fallbacks remain available if fonts cannot load. The shell could not
download font packages because registry DNS was unavailable; native therefore
uses system fonts until native font assets can be bundled and verified. The app
never waits on external fonts to show its controls or recovery flow.

Headings use 28–32px, section headings 20px, body 15–17px, and labels at least
12px. Compact live dialogue is 17px/24px. Long labels wrap. Display/body families
are distinct; Bricolage's bold rounded forms are retained where available.

## Layout

The home uses the supplied city illustration with a floating real phrase-review
count, an illustrated current mission with a lime CTA, four quick-action tiles,
and an Explore topics card. Slots map to actual phrase review, catalog, speaking,
and progress actions. Unimplemented grammar/listening drills are not fabricated.

The conversation uses a character-led header, real segmented scene progress, an
illustrated mission strip, chronological actor/learner bubbles, and a rounded dock.
Suggested phrases appear in a collapsible dock card, start closed, and require
explicit reveal; reply drafting never sends automatically. The dock owns scrolling
at short heights and under large text. The live microphone uses the deep teal action
color; typing, help, and stopping remain reachable.

Progress reuses the reference landscape and stat-card layout with durable active-
language receipt counts, final learner turns, and archived phrase counts. Skill
states stay grounded; no arbitrary percentage or A1-to-A2 claim is imported.
Existing evidence, phrase, history, and dispute controls remain available.

Catalog, briefing, program, recap, settings, privacy, onboarding, phrase detail,
recovery, and review/coach sheets reuse the same typography, tokens, surfaces,
buttons, and artwork. Phone gutters are 16–20px; reading width is 720px. Desktop
retains the functional sidebar. Navigation reserves its own space instead of
covering learning/input content.

## Elevation & Depth

ELEVATION.card and ELEVATION.floating follow the reference's teal-toned shadows.
Navigation uses translucent surfaces and web backdrop blur; native keeps a readable
surface fallback. Artwork is decorative and excluded from assistive technology.
SVG gradient IDs are scoped per mounted instance. No reference scripts are executed.

## Shapes

Cards use 24–28px corners, primary buttons and chips are pills, navigation 31px,
coach/modal docks 32px, and icon wells 15–16px. Conversation tails use an 8px corner.
Controls retain at least 48px touch targets even where the source uses 44px.

## Components

Canonical owners: AppText; ui.tsx Button/Card/Field/ChipRow; RootHeader; tab layout;
ReferenceArtwork and its static lingoArtwork strings; ConversationStage and
SuggestedReplies; ThemeProvider and i18n. UX-CONTRACT.md retains behavioral ownership.

## Do's and Don'ts

- Keep text on readable surfaces, focus visible, scrollbars operable, and reduced motion honored.
- Use real archive counts and reducer-confirmed checkpoints; never mock learning progress.
- Persist support before reveal or draft use; preserve attempt, consent, and audio ownership.
- Preserve archive/history and Belgian Dutch practice rather than copying German demo content.
- Do not import phone chrome or placeholder actions as app functionality.
