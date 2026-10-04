/**
 * Envelope and renderer for exported learning receipts.
 *
 * A receipt is the one artifact that leaves the app: the learner can keep it, attach it
 * to something, or hand it to someone else. Two consequences follow, and both were
 * broken.
 *
 * It has to disclose how the session was produced. The in-app copy of that disclosure
 * exists in all four locales, but the exported text had none, so a file that travels
 * further than the app said nothing about how the voice was processed or where records
 * are kept.
 *
 * It has to name the product. The header still read "MISSION COACH", the pre-rename
 * name, in an artifact whose whole purpose is to be shown to someone else.
 */

import { MISSION_CATALOG } from '../../data/missions';
import type { PhraseItem, SessionRecord } from '../../types';

/** Divider width shared by the existing hand-rolled receipt format. */
const RULE = '='.repeat(56);
const THIN = '-'.repeat(56);

/** Receipt title. Not localized: the body of these exports is English-only today. */
export const LEARNING_RECEIPT_TITLE = 'LEARNBYRP — LEARNING RECEIPT';

/**
 * How this session was processed, in the words already approved for the settings
 * screen. `learningReceiptDisclosure.test.ts` asserts this stays identical to
 * `getTranslations('en').settings.privacyDisclosure`, so the approved wording and the
 * exported wording cannot drift apart.
 */
export const LEARNING_RECEIPT_DISCLOSURE =
  'Your voice audio is converted to speech to enable natural character dialogue. Transcripts and observations are stored locally on your device in your private ledger.';

export function learningReceiptHeader(): string {
  return [RULE, LEARNING_RECEIPT_TITLE, RULE, ''].join('\n');
}

/**
 * Trailing disclosure block.
 *
 * Kept as a separate function rather than folded into the header so a receipt body can
 * be restructured without dropping the notice, and so a test can assert on it directly.
 */
export function learningReceiptDisclosure(): string {
  return ['', THIN, 'HOW THIS SESSION WAS PROCESSED', THIN, LEARNING_RECEIPT_DISCLOSURE, ''].join(
    '\n'
  );
}

export function learningReceiptFooter(): string {
  return [THIN, ''].join('\n');
}

/**
 * Renders the whole receipt.
 *
 * There is deliberately one implementation. The SQLite and IndexedDB repositories used
 * to build their own text, and they had drifted: SQLite emitted language, mode, start
 * time, outcome and a per-phrase recall status, while IndexedDB emitted none of those
 * and formatted phrases differently. The parity suite did not catch it because it only
 * asserted the method existed on both. The same learner therefore received a different
 * receipt depending on whether they were on web or native.
 *
 * Two divergent copies of an export can only be kept in agreement by testing them into
 * agreement, which fails the moment one side is edited. One renderer makes the question
 * disappear.
 *
 * The mission is named by title because a receipt is read by a person, with the id kept
 * alongside it so the line is still traceable back to a catalogue entry.
 */
export function renderLearningReceipt(session: SessionRecord, phrases: PhraseItem[]): string {
  const used = new Set(session.observations.map(observation => observation.itemId));
  const usedPhrases = phrases.filter(phrase => used.has(phrase.id));

  let out = learningReceiptHeader();
  out += `Session: ${session.id}\n`;
  out += `Mission: ${missionTitle(session.missionId)} (${session.missionId})\n`;
  out += `Language: ${session.language}\n`;
  out += `Mode: ${session.mode}\n`;
  out += `Started: ${session.startedAt}\n`;
  out += `Ended: ${session.endedAt ?? 'unknown'}\n`;
  out += `Outcome: ${session.taskOutcome}\n\n`;
  out += 'WHAT YOU ACTUALLY USED\n';

  for (const phrase of usedPhrases) {
    out += `\n${phrase.form}\n`;
    out += `  ${phrase.meaning}\n`;
    out += `  status: ${phrase.recallStatus}\n`;
  }

  if (usedPhrases.length === 0) {
    out += '\nNo phrases were recorded as used in this session.\n';
  }

  out += '\n';
  out += learningReceiptDisclosure();
  out += learningReceiptFooter();
  return out;
}

function missionTitle(missionId: string): string {
  return MISSION_CATALOG.find(mission => mission.id === missionId)?.title ?? missionId;
}
