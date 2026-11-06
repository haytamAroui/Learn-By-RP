import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { REST_POSE, blendMouthPose, mouthPoseForViseme, type MouthPose } from './visemeTargets';
import { useAvatarPlaybackContext } from './avatarPlaybackContext';

const MOUTH_STEP = 0.28;
const HEAD_RADIUS = 0.62;
const MOUTH_REST_Y = -0.16;

interface MouthRig {
  jaw: THREE.Mesh;
  lips: THREE.Mesh;
  teeth: THREE.Mesh;
}

/**
 * A stylised character built from primitives.
 *
 * It is a placeholder with the same contract as a real avatar asset: it
 * exposes a mouth that follows the viseme clock, an idle breath, and a blink.
 * A GLB with morph targets can replace it without changing the stage.
 */
export function ProceduralAvatar({
  skin = '#E8C39E',
  shirt = '#3F6B5A',
}: {
  skin?: string;
  shirt?: string;
}) {
  const playback = useAvatarPlaybackContext();
  const headRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const lipsRef = useRef<THREE.Mesh>(null);
  const teethRef = useRef<THREE.Mesh>(null);
  const eyeLeft = useRef<THREE.Group>(null);
  const eyeRight = useRef<THREE.Group>(null);
  const poseRef = useRef<MouthPose>(REST_POSE);
  const blinkRef = useRef(0);

  useFrame((state, delta) => {
    const pose = mouthPoseForViseme(playback.shapeRef.current);
    poseRef.current = blendMouthPose(poseRef.current, pose, MOUTH_STEP);
    const current = poseRef.current;

    const jaw = mouthRef.current;
    const lips = lipsRef.current;
    const teeth = teethRef.current;

    if (jaw) {
      jaw.scale.set(
        1 + current.mouthWide * 0.25,
        0.18 + current.jawOpen * 0.75,
        1
      );
      jaw.position.y = MOUTH_REST_Y - current.jawOpen * 0.1;
    }
    if (lips) {
      lips.scale.set(
        1 + current.mouthWide * 0.3 - current.mouthRound * 0.25,
        0.5 + current.mouthClose * 0.35,
        0.5 + current.mouthRound * 0.5
      );
      lips.position.z = current.mouthRound * 0.04;
    }
    if (teeth) {
      teeth.visible = current.teeth > 0.05;
      teeth.scale.set(1 + current.mouthWide * 0.2, 0.4 + current.teeth * 0.4, 0.4);
    }

    // Idle motion stays small so the character never competes with the text.
    const head = headRef.current;
    if (head) {
      const breath = Math.sin(state.clock.elapsedTime * 1.4) * 0.012;
      head.position.y = breath;
      head.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.05;
    }

    // Blink: the eye group closes, which reads as a blink at portrait size.
    blinkRef.current -= delta;
    if (blinkRef.current <= 0) {
      blinkRef.current = 2.6 + Math.random() * 3.4;
    }
    const closing = blinkRef.current < 0.12 ? 1 - blinkRef.current / 0.12 : 0;
    const openness = 1 - closing * 0.92;
    if (eyeLeft.current) eyeLeft.current.scale.y = openness;
    if (eyeRight.current) eyeRight.current.scale.y = openness;

    // Mouth returns to rest when nobody is speaking.
    if (!playback.speakingRef.current) {
      poseRef.current = blendMouthPose(poseRef.current, REST_POSE, 0.2);
    }
  });

  return (
    <group>
      <mesh position={[0, -1.05, 0]} castShadow>
        <capsuleGeometry args={[0.52, 0.95, 6, 18]} />
        <meshStandardMaterial color={shirt} roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.32, 16]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>

      <group ref={headRef} position={[0, 0.68, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[HEAD_RADIUS, 32, 32]} />
          <meshStandardMaterial color={skin} roughness={0.75} />
        </mesh>

        <mesh position={[0, 0.14, -0.05]} scale={[1.03, 0.66, 1.02]}>
          <sphereGeometry args={[HEAD_RADIUS, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color="#4A3A30" roughness={0.95} />
        </mesh>

        <mesh position={[0, 0.36, 0.2]} rotation={[0.35, 0, 0]} scale={[1, 0.42, 0.5]}>
          <sphereGeometry args={[HEAD_RADIUS, 24, 18]} />
          <meshStandardMaterial color="#4A3A30" roughness={0.95} />
        </mesh>

        <mesh position={[0, 0.3, 0.42]} rotation={[0.22, 0, 0]} scale={[0.92, 0.2, 0.34]}>
          <sphereGeometry args={[HEAD_RADIUS, 24, 16]} />
          <meshStandardMaterial color="#4A3A30" roughness={0.95} />
        </mesh>

        <group ref={eyeLeft} position={[-0.23, 0.07, 0.52]}>
          <mesh>
            <sphereGeometry args={[0.092, 20, 20]} />
            <meshStandardMaterial color="#FBF8F4" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.055]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color="#2B2320" roughness={0.3} />
          </mesh>
          <mesh position={[-0.016, 0.022, 0.082]}>
            <sphereGeometry args={[0.016, 10, 10]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </mesh>
        </group>

        <group ref={eyeRight} position={[0.23, 0.07, 0.52]}>
          <mesh>
            <sphereGeometry args={[0.092, 20, 20]} />
            <meshStandardMaterial color="#FBF8F4" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.055]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color="#2B2320" roughness={0.3} />
          </mesh>
          <mesh position={[0.016, 0.022, 0.082]}>
            <sphereGeometry args={[0.016, 10, 10]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </mesh>
        </group>

        <mesh position={[-0.23, 0.185, 0.53]} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[0.16, 0.022, 0.02]} />
          <meshStandardMaterial color="#4A3A30" roughness={0.9} />
        </mesh>
        <mesh position={[0.23, 0.185, 0.53]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.16, 0.022, 0.02]} />
          <meshStandardMaterial color="#4A3A30" roughness={0.9} />
        </mesh>

        <mesh position={[0, -0.02, 0.55]} scale={[0.9, 0.35, 0.6]}>
          <sphereGeometry args={[0.1, 14, 12]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>

        <mesh ref={mouthRef} position={[0, MOUTH_REST_Y, 0.56]} scale={[1, 0.18, 1]}>
          <sphereGeometry args={[0.13, 18, 14]} />
          <meshStandardMaterial color="#5C2A2A" roughness={0.6} />
        </mesh>

        <mesh ref={lipsRef} position={[0, MOUTH_REST_Y, 0.6]} scale={[1, 0.5, 0.5]}>
          <torusGeometry args={[0.12, 0.026, 12, 24]} />
          <meshStandardMaterial color="#B4706A" roughness={0.7} />
        </mesh>

        <mesh ref={teethRef} position={[0, MOUTH_REST_Y + 0.03, 0.6]} visible={false}>
          <boxGeometry args={[0.16, 0.05, 0.03]} />
          <meshStandardMaterial color="#FAF6F0" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}
