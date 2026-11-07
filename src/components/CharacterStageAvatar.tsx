import React from 'react';
import { Platform, View } from 'react-native';
import { AvatarStage } from '../features/avatar';
import { resolveAvatarId } from '../features/avatar/avatarCatalog';
import type { MissionDefinition } from '../types';
import { CharacterAvatar } from './ConversationStage';

/**
 * The character portrait in the live session.
 *
 * On a device the portrait is a 3D character that follows the voice. On the
 * web build it stays the designed artwork, so the rendered-route baselines
 * keep describing the current design instead of a renderer. A device that
 * cannot create a GL context falls back to the same artwork.
 */
export function CharacterStageAvatar({
  mission,
  size = 56,
  enabled = true,
  preferredAvatarId,
}: {
  mission: MissionDefinition;
  size?: number;
  enabled?: boolean;
  preferredAvatarId?: string;
}) {
  const artwork = <CharacterAvatar mission={mission} size={size} />;

  // The learner's chosen tutor comes first, then the face the mission
  // authored, then a stable one for the character.
  const avatarId = resolveAvatarId({
    preferredAvatarId,
    characterAvatarId: mission.character.avatarId,
    characterName: mission.character.name,
  });

  return (
    <View
      className="overflow-hidden rounded-full border border-border-subtle/40 bg-warning-soft"
      style={{ width: size, height: size }}
    >
      <AvatarStage
        width={size}
        height={size}
        fallback={artwork}
        enabled={enabled}
        avatarId={avatarId}
      />
    </View>
  );
}
