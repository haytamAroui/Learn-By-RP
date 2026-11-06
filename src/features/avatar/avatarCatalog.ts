/**
 * The tutor avatars.
 *
 * A character is a person, and a person keeps a face. The catalog is the
 * list of faces the app can show, and the resolution decides which one a
 * character wears.
 *
 * The learner's own choice comes first: choosing a tutor is the learner's
 * decision, not the content's. The authored character is next, and a character
 * with no authored face still gets a stable one, so the same character always
 * looks the same.
 */
export interface AvatarOption {
  id: string;
  /** The name shown to the learner when they pick a tutor. */
  label: string;
  /** The asset key the native renderer loads. */
  asset: string;
}

export const AVATARS: readonly AvatarOption[] = [
  { id: 'lotte', label: 'Lotte', asset: 'tutor' },
  { id: 'sofie', label: 'Sofie', asset: 'tutor-alt' },
];

export const DEFAULT_AVATAR_ID = AVATARS[0].id;

export function avatarById(id: string | undefined): AvatarOption | undefined {
  if (!id) return undefined;
  return AVATARS.find(avatar => avatar.id === id);
}

/**
 * A stable pick for a character with no authored face.
 *
 * The same name always lands on the same face, so a character does not change
 * appearance between sessions.
 */
function stablePick(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return AVATARS[hash % AVATARS.length].id;
}

export interface ResolveAvatarInput {
  /** The learner's chosen tutor. */
  preferredAvatarId?: string;
  /** The face the mission authored for this character. */
  characterAvatarId?: string;
  /** The character, used to keep an unassigned character stable. */
  characterName?: string;
}

/**
 * The face a character wears.
 *
 * An unknown id falls through to the next rule rather than showing nothing.
 */
export function resolveAvatarId(input: ResolveAvatarInput): string {
  const preferred = avatarById(input.preferredAvatarId);
  if (preferred) return preferred.id;

  const authored = avatarById(input.characterAvatarId);
  if (authored) return authored.id;

  if (input.characterName) {
    return stablePick(input.characterName.trim().toLowerCase());
  }

  return DEFAULT_AVATAR_ID;
}
