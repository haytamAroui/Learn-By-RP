import { describe, expect, it } from 'vitest';
import { getTranslations } from '../src/features/i18n';
import {
  LEARNING_RECEIPT_DISCLOSURE,
  LEARNING_RECEIPT_TITLE,
  learningReceiptDisclosure,
  learningReceiptHeader,
} from '../src/features/archive/learningReceipt';

describe('learning receipt envelope', () => {
  it('names the current product', () => {
    // The exported header read "MISSION COACH" long after the rename. A receipt is the
    // artifact a learner shows to someone else, so the wrong product name is the most
    // visible possible version of this bug.
    expect(learningReceiptHeader()).toContain(LEARNING_RECEIPT_TITLE);
    expect(LEARNING_RECEIPT_TITLE).toContain('LEARNBYRP');
    expect(learningReceiptHeader()).not.toMatch(/MISSION COACH/i);
  });

  it('uses the same disclosure wording the learner already accepted in Settings', () => {
    // If the approved Settings copy is edited and this is not, the app and the exported
    // file start telling the learner different things about their own voice data.
    const english = getTranslations('en');
    expect(LEARNING_RECEIPT_DISCLOSURE).toBe(english.settings.privacyDisclosure);
    expect(english.settings.sectionPrivacy.length).toBeGreaterThan(0);
  });

  it('carries a disclosure in every locale the product ships', () => {
    for (const locale of ['en', 'fr', 'es', 'nl'] as const) {
      const copy = getTranslations(locale);
      expect(copy.settings.privacyDisclosure.trim().length).toBeGreaterThan(20);
      expect(copy.settings.privacyDisclosure).not.toBe(copy.settings.sectionPrivacy);
    }
  });

  it('states how voice was processed and where records are kept', () => {
    const disclosure = learningReceiptDisclosure();
    expect(disclosure).toContain(LEARNING_RECEIPT_DISCLOSURE);
    // The two facts a learner cannot infer from a bare transcript export.
    expect(disclosure.toLowerCase()).toContain('audio');
    expect(disclosure.toLowerCase()).toMatch(/stored|kept/);
  });

  it('is a trailing block so a restructured body cannot silently drop it', () => {
    // Not a hard guarantee - a body can still be rewritten without calling this - but it
    // keeps the notice in one place both repositories must use.
    expect(learningReceiptDisclosure().endsWith('\n')).toBe(true);
    expect(learningReceiptHeader().endsWith('\n')).toBe(true);
  });
});
