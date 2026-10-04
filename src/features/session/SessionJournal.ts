import type { SessionRecord } from '../../types';

/** Serializes immutable activity checkpoints; finish explicitly drains the queue. */
export class SessionJournal {
  private tail: Promise<void> = Promise.resolve();
  private latest: Promise<void> = this.tail;

  constructor(private readonly write: (session: SessionRecord) => Promise<void>) {}

  save(session: SessionRecord): Promise<void> {
    const snapshot = JSON.parse(JSON.stringify(session)) as SessionRecord;
    this.latest = this.tail.then(() => this.write(snapshot));
    this.tail = this.latest.catch(() => undefined);
    return this.latest;
  }

  flush(): Promise<void> { return this.latest; }
}
