import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('governed mission session handoff', () => {
  it('uses the persisted session identity inside LiveSessionView', () => {
    const live = readFileSync('src/components/LiveSessionView.tsx', 'utf8');

    expect(live).toContain('initialSession: SessionRecord');
    expect(live).toContain('const sessionId = initialSession.id');
    expect(live).toContain('const mode = initialSession.mode');
    expect(live).toContain('const coldAttempt = initialSession.coldAttempt');
    expect(live).not.toMatch(/useState\(\(\) => `session-\$\{Date\.now\(\)\}`\)/);
  });

  it('initializes support from the exact persisted briefing ledger', () => {
    const live = readFileSync('src/components/LiveSessionView.tsx', 'utf8');

    expect(live).toContain('() => initialSession.supportExposures');
    expect(live).not.toMatch(
      /if \(!coldAttempt\)[\s\S]{0,500}setSupportExposures\([\s\S]{0,500}mission\.usefulPhrases\.map/
    );
  });

  it('persists preflight support and cold-attempt metadata in native sqlite', () => {
    const nativeRepo = readFileSync(
      'src/features/archive/SqliteArchiveRepository.ts',
      'utf8'
    );
    const schema = readFileSync('src/features/archive/schema.ts', 'utf8');

    expect(schema).toContain('ALTER TABLE sessions ADD COLUMN cold_attempt');
    expect(nativeRepo).toContain('usage_json, cold_attempt');
    expect(nativeRepo).toContain('session.coldAttempt ? 1 : 0');
    expect(nativeRepo).toContain('for (const exposure of session.supportExposures ?? [])');
    expect(nativeRepo).toContain('INSERT OR REPLACE INTO scene_state');
    expect(nativeRepo).toContain('coldAttempt: bool(row.cold_attempt)');
  });

  it('treats intentional close as user-ended rather than interrupted recovery', () => {
    const live = readFileSync('src/components/LiveSessionView.tsx', 'utf8');

    expect(live).toContain("handleFinishConversation('user_ended')");
  });
});
