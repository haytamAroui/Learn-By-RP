import type { VisemeShape } from '../../providers/voice/visemes';

/**
 * What the character is doing.
 *
 * A mouth that only opens and closes is a recording. A character that listens,
 * thinks and reacts is a character, and the learner can read the tutor's state
 * from the way the tutor holds itself.
 */
export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'reacting';

export type AvatarReaction = 'greet' | 'praise' | 'encourage' | 'consider';

/**
 * How a state is expressed.
 *
 * The weights address the ARKit blendshapes a standard avatar rig carries, so
 * an expression is a mix of several shapes rather than one switch.
 */
export interface AvatarExpression {
  /** Blendshape weights, from 0 to 1. */
  weights: Readonly<Record<string, number>>;
  /** Head movement in radians: pitch, yaw, roll. */
  head: { pitch: number; yaw: number; roll: number };
  /** Eye openness, where 1 is fully open. */
  eyeOpen: number;
}

const NEUTRAL: AvatarExpression = {
  weights: {},
  head: { pitch: 0, yaw: 0, roll: 0 },
  eyeOpen: 1,
};

const EXPRESSIONS: Record<AvatarState, AvatarExpression> = {
  idle: {
    ...NEUTRAL,
    weights: { mouthClose: 0.1 },
  },
  listening: {
    ...NEUTRAL,
    // Attentive: the head tilts a little and the brows lift.
    weights: { browInnerUp: 0.25, browOuterUpLeft: 0.15, browOuterUpRight: 0.15, eyeWideLeft: 0.1, eyeWideRight: 0.1 },
    head: { pitch: 0.04, yaw: -0.05, roll: 0.05 },
  },
  thinking: {
    ...NEUTRAL,
    // Looking aside and up, with the brows drawn together.
    weights: { browDownLeft: 0.2, browDownRight: 0.2, eyeLookUpLeft: 0.35, eyeLookUpRight: 0.35, mouthClose: 0.15 },
    head: { pitch: -0.12, yaw: 0.16, roll: 0 },
  },
  speaking: {
    ...NEUTRAL,
    head: { pitch: 0.02, yaw: 0.02, roll: 0 },
  },
  reacting: {
    ...NEUTRAL,
    // Warm: the brows lift and the mouth smiles.
    weights: { browInnerUp: 0.3, browOuterUpLeft: 0.25, browOuterUpRight: 0.25, mouthSmileLeft: 0.35, mouthSmileRight: 0.35, eyeSquintLeft: 0.2, eyeSquintRight: 0.2 },
    head: { pitch: 0.06, yaw: 0, roll: 0 },
  },
};

const REACTION_EXPRESSIONS: Record<AvatarReaction, AvatarExpression> = {
  greet: {
    ...NEUTRAL,
    weights: { mouthSmileLeft: 0.4, mouthSmileRight: 0.4, browOuterUpLeft: 0.2, browOuterUpRight: 0.2 },
    head: { pitch: 0.05, yaw: 0, roll: 0 },
  },
  praise: {
    ...NEUTRAL,
    weights: { mouthSmileLeft: 0.55, mouthSmileRight: 0.55, browInnerUp: 0.35, eyeSquintLeft: 0.3, eyeSquintRight: 0.3 },
    head: { pitch: 0.08, yaw: 0, roll: 0 },
  },
  encourage: {
    ...NEUTRAL,
    weights: { mouthSmileLeft: 0.3, mouthSmileRight: 0.3, browInnerUp: 0.2, eyeWideLeft: 0.15, eyeWideRight: 0.15 },
    head: { pitch: 0.04, yaw: 0, roll: 0 },
  },
  consider: {
    ...NEUTRAL,
    weights: { browDownLeft: 0.3, browDownRight: 0.3, eyeLookUpLeft: 0.25, eyeLookUpRight: 0.25 },
    head: { pitch: -0.08, yaw: 0.12, roll: 0 },
  },
};

export function expressionForState(state: AvatarState): AvatarExpression {
  return EXPRESSIONS[state] ?? NEUTRAL;
}

export function expressionForReaction(reaction: AvatarReaction): AvatarExpression {
  return REACTION_EXPRESSIONS[reaction] ?? EXPRESSIONS.reacting;
}

/** The shape a reaction keeps its mouth in while it is held. */
export function reactionMouthShape(reaction: AvatarReaction): VisemeShape {
  return reaction === 'praise' || reaction === 'greet' || reaction === 'encourage'
    ? 'aa'
    : 'E';
}
