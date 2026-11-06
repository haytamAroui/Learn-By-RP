import { describe, expect, it } from 'vitest';
import {
  AVATARS,
  DEFAULT_AVATAR_ID,
  avatarById,
  resolveAvatarId,
} from './avatarCatalog';

describe('avatar catalog', () => {
  it('has at least one avatar', () => {
    expect(AVATARS.length).toBeGreaterThan(0);
  });

  it('gives every avatar an id and an asset', () => {
    for (const avatar of AVATARS) {
      expect(avatar.id).toBeTruthy();
      expect(avatar.asset).toBeTruthy();
      expect(avatar.label).toBeTruthy();
    }
  });

  it('finds an avatar by id', () => {
    expect(avatarById(AVATARS[0].id)?.id).toBe(AVATARS[0].id);
    expect(avatarById('nobody')).toBeUndefined();
    expect(avatarById(undefined)).toBeUndefined();
  });
});

describe('avatar resolution', () => {
  it('uses the learner choice above everything else', () => {
    const id = resolveAvatarId({
      preferredAvatarId: AVATARS[1].id,
      characterAvatarId: AVATARS[0].id,
      characterName: 'Lotte',
    });
    expect(id).toBe(AVATARS[1].id);
  });

  it('uses the authored face when the learner has no choice', () => {
    const id = resolveAvatarId({
      characterAvatarId: AVATARS[1].id,
      characterName: 'Lotte',
    });
    expect(id).toBe(AVATARS[1].id);
  });

  it('ignores an unknown learner choice', () => {
    const id = resolveAvatarId({
      preferredAvatarId: 'nobody',
      characterAvatarId: AVATARS[0].id,
    });
    expect(id).toBe(AVATARS[0].id);
  });

  it('gives a character the same face every time', () => {
    const first = resolveAvatarId({ characterName: 'Klara' });
    const second = resolveAvatarId({ characterName: 'Klara' });
    expect(first).toBe(second);
  });

  it('gives different characters their own faces when the catalog allows', () => {
    const names = ['Lotte', 'Sofie', 'Klara', 'Mateo', 'Carmen', 'Aoi', 'Pierre', 'Kenji'];
    const assigned = new Set(names.map(name => resolveAvatarId({ characterName: name })));
    expect(assigned.size).toBeGreaterThan(1);
  });

  it('falls back to the default when there is nothing to go on', () => {
    expect(resolveAvatarId({})).toBe(DEFAULT_AVATAR_ID);
  });
});
