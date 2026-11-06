import type { VisemeShape } from '../../providers/voice/visemes';

/**
 * Mouth targets.
 *
 * Two representations are needed. A pose drives a procedural character, where
 * there are no morph targets to address. Morph target names drive a real
 * avatar asset, where the renderer addresses named blendshapes.
 *
 * The morph names follow the Oculus/RPM viseme set, which is what Ready Player
 * Me and most glTF avatars ship. The ARKit weights express the same viseme
 * with the ARKit blendshapes a standard avatar rig also carries, which gives a
 * rounder mouth than a single viseme shape on its own.
 *
 * The ARKit weights follow the published Oculus viseme reference and the
 * tuning used by the MIT-licensed `talking-head-studio` project.
 */
export interface MouthPose {
  /** How far the jaw drops. */
  jawOpen: number;
  /** How far the mouth corners pull apart. */
  mouthWide: number;
  /** How far the lips push forward. */
  mouthRound: number;
  /** How firmly the lips press together. */
  mouthClose: number;
  /** Whether the upper teeth are visible. */
  teeth: number;
}

export const REST_POSE: MouthPose = {
  jawOpen: 0,
  mouthWide: 0,
  mouthRound: 0,
  mouthClose: 0,
  teeth: 0,
};

const POSES: Record<VisemeShape, MouthPose> = {
  sil: REST_POSE,
  PP: { jawOpen: 0.04, mouthWide: 0, mouthRound: 0.1, mouthClose: 0.9, teeth: 0 },
  FF: { jawOpen: 0.18, mouthWide: 0.35, mouthRound: 0, mouthClose: 0, teeth: 0.85 },
  TH: { jawOpen: 0.25, mouthWide: 0.3, mouthRound: 0, mouthClose: 0, teeth: 0.6 },
  DD: { jawOpen: 0.3, mouthWide: 0.35, mouthRound: 0, mouthClose: 0, teeth: 0.4 },
  kk: { jawOpen: 0.35, mouthWide: 0.4, mouthRound: 0, mouthClose: 0, teeth: 0.3 },
  CH: { jawOpen: 0.3, mouthWide: 0.5, mouthRound: 0.2, mouthClose: 0, teeth: 0.5 },
  SS: { jawOpen: 0.18, mouthWide: 0.45, mouthRound: 0, mouthClose: 0.15, teeth: 0.7 },
  nn: { jawOpen: 0.2, mouthWide: 0.4, mouthRound: 0, mouthClose: 0.1, teeth: 0.3 },
  RR: { jawOpen: 0.25, mouthWide: 0.15, mouthRound: 0.6, mouthClose: 0, teeth: 0.2 },
  aa: { jawOpen: 0.85, mouthWide: 0.1, mouthRound: 0, mouthClose: 0, teeth: 0.2 },
  E: { jawOpen: 0.3, mouthWide: 0.85, mouthRound: 0, mouthClose: 0, teeth: 0.35 },
  I: { jawOpen: 0.2, mouthWide: 0.7, mouthRound: 0, mouthClose: 0, teeth: 0.35 },
  O: { jawOpen: 0.45, mouthWide: 0, mouthRound: 0.85, mouthClose: 0, teeth: 0.1 },
  U: { jawOpen: 0.2, mouthWide: 0, mouthRound: 0.95, mouthClose: 0.05, teeth: 0 },
};

/** Morph target names per viseme, for avatar assets that ship Oculus visemes. */
export const VISEME_MORPH_TARGETS: Record<VisemeShape, readonly string[]> = {
  sil: ['viseme_sil'],
  PP: ['viseme_PP'],
  FF: ['viseme_FF'],
  TH: ['viseme_TH'],
  DD: ['viseme_DD'],
  kk: ['viseme_kk'],
  CH: ['viseme_CH'],
  SS: ['viseme_SS'],
  nn: ['viseme_nn'],
  RR: ['viseme_RR'],
  aa: ['viseme_aa'],
  E: ['viseme_E'],
  I: ['viseme_I'],
  O: ['viseme_O'],
  U: ['viseme_U'],
};

/**
 * ARKit blendshape weights per viseme.
 *
 * A standard avatar rig carries the ARKit set, so a viseme can be expressed
 * with several shapes at once, which reads as a mouth rather than a switch.
 */
export const ARKIT_WEIGHTS: Record<VisemeShape, Readonly<Record<string, number>>> = {
  sil: { mouthClose: 0.1 },
  PP: { mouthClose: 0.8, mouthPucker: 0.3 },
  FF: { mouthLowerDownLeft: 0.5, mouthLowerDownRight: 0.5, mouthRollLower: 0.4 },
  TH: { tongueOut: 0.6, jawOpen: 0.15, mouthLowerDownLeft: 0.2, mouthLowerDownRight: 0.2 },
  DD: { mouthShrugUpper: 0.5, jawOpen: 0.2, mouthUpperUpLeft: 0.3, mouthUpperUpRight: 0.3 },
  kk: { jawOpen: 0.25, mouthStretchLeft: 0.4, mouthStretchRight: 0.4, mouthShrugUpper: 0.2 },
  CH: { mouthStretchLeft: 0.5, mouthStretchRight: 0.5, jawOpen: 0.3, mouthFunnel: 0.2 },
  SS: { mouthStretchLeft: 0.35, mouthStretchRight: 0.35, mouthClose: 0.3 },
  nn: { jawOpen: 0.15, mouthDimpleLeft: 0.4, mouthDimpleRight: 0.4, mouthShrugLower: 0.2 },
  RR: { mouthPucker: 0.4, mouthFunnel: 0.3, jawOpen: 0.15, mouthRollLower: 0.2 },
  aa: { jawOpen: 0.7, mouthLowerDownLeft: 0.4, mouthLowerDownRight: 0.4 },
  E: { mouthSmileLeft: 0.6, mouthSmileRight: 0.6, jawOpen: 0.2 },
  I: { mouthSmileLeft: 0.4, mouthSmileRight: 0.4, jawOpen: 0.1 },
  O: { jawOpen: 0.4, mouthFunnel: 0.8 },
  U: { mouthPucker: 0.9, mouthRollLower: 0.3 },
};

export function mouthPoseForViseme(shape: VisemeShape): MouthPose {
  return POSES[shape] ?? REST_POSE;
}

/**
 * Move a pose towards a target by a fixed step.
 *
 * The mouth must not snap between shapes. A fixed step per frame keeps the
 * movement readable at any frame rate.
 */
export function blendMouthPose(
  current: MouthPose,
  target: MouthPose,
  amount: number
): MouthPose {
  const step = Math.max(0, Math.min(1, amount));
  const move = (from: number, to: number) => from + (to - from) * step;
  return {
    jawOpen: move(current.jawOpen, target.jawOpen),
    mouthWide: move(current.mouthWide, target.mouthWide),
    mouthRound: move(current.mouthRound, target.mouthRound),
    mouthClose: move(current.mouthClose, target.mouthClose),
    teeth: move(current.teeth, target.teeth),
  };
}
