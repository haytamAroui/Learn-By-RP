import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAssets } from 'expo-asset';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useAvatarPlaybackContext } from './avatarPlaybackContext';
import { setAvatarReady } from './avatarReadiness';
import {
  expressionForReaction,
  expressionForState,
  reactionMouthShape,
  type AvatarExpression,
} from './avatarExpressions';
import {
  getAvatarReaction,
  getAvatarState,
  subscribeAvatarReaction,
  subscribeAvatarState,
} from './avatarState';
import { ARKIT_WEIGHTS, VISEME_MORPH_TARGETS } from './visemeTargets';
import { loadAvatarBytes } from './avatarAssetLoader';

const BLINK_SHAPES = ['eyeBlinkLeft', 'eyeBlinkRight', 'eyesClosed'];

/** How quickly a morph target reaches its target influence. */
const MORPH_STEP = 0.35;

interface MorphTarget {
  mesh: THREE.Mesh;
  index: number;
  name: string;
  current: number;
}

/**
 * A rigged avatar with facial morph targets.
 *
 * The model is a Ready Player Me avatar: a full body mesh with the Oculus
 * viseme set, so the mouth shapes this app computes map straight onto the
 * blendshapes the model already carries.
 */
export function AvatarModelGLTF({
  source,
  onError,
}: {
  source: number;
  onError?: (message: string) => void;
}) {
  const playback = useAvatarPlaybackContext();
  const camera = useThree(state => state.camera) as THREE.PerspectiveCamera;
  const [assets, assetError] = useAssets(source);
  const asset = assets?.[0];
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const targetsRef = useRef<MorphTarget[]>([]);
  const blinkRef = useRef(1.8);
  const expressionRef = useRef<AvatarExpression>(expressionForState('idle'));
  const reactionRef = useRef<0 | number>(0);
  const headBoneRef = useRef<THREE.Bone | null>(null);

  useEffect(() => {
    if (assetError) {
      setError(String(assetError));
      onError?.(String(assetError));
      return;
    }
    let cancelled = false;
    const uri = asset?.localUri ?? asset?.uri;
    if (!uri) return;

    const loader = new GLTFLoader();
    loadAvatarBytes(uri)
      .then(bytes => loader.parseAsync(bytes, ''))
      .then(gltf => {
        if (cancelled) return;
        const root = gltf.scene;
        root.traverse(child => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh || !mesh.morphTargetDictionary) return;
          mesh.morphTargetInfluences = mesh.morphTargetInfluences ?? [];
          for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) {
            targetsRef.current.push({ mesh, index, name, current: 0 });
          }
        });
        setScene(root);
        frameHead(root, camera);
        headBoneRef.current = findHeadBone(root);
        setAvatarReady(true);
      })
      .catch(reason => {
        if (cancelled) return;
        const message = reason instanceof Error ? reason.message : 'avatar asset failed to load';
        setError(message);
        onError?.(message);
        // The placeholder character is on screen, so the session may speak.
        setAvatarReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [asset, assetError, camera, onError]);

  useEffect(() => {
    // The state the character is already in when it appears is the state it
    // shows, so the current one is read before anything changes.
    expressionRef.current = expressionForState(getAvatarState());
    const unsubscribeState = subscribeAvatarState(next => {
      expressionRef.current = expressionForState(next);
    });
    const unsubscribeReaction = subscribeAvatarReaction(reaction => {
      expressionRef.current = expressionForReaction(reaction);
      // A reaction is held for a moment and then the state takes over again.
      reactionRef.current = 1.6;
    });
    return () => {
      unsubscribeState();
      unsubscribeReaction();
    };
  }, []);

  useFrame((state, delta) => {
    const reaction = getAvatarReaction();
    const heldReaction = reactionRef.current > 0 ? reaction : null;
    const shape = heldReaction
      ? reactionMouthShape(heldReaction)
      : playback.shapeRef.current;
    const wanted = new Set<string>(VISEME_MORPH_TARGETS[shape] ?? []);
    const arkit = ARKIT_WEIGHTS[shape] ?? {};

    if (reactionRef.current > 0) {
      reactionRef.current = Math.max(0, reactionRef.current - delta);
    }

    const expression = expressionRef.current;
    const head = headBoneRef.current;
    if (head) {
      // The head is posed through its bone, so the skin follows it.
      head.rotation.set(expression.head.pitch, expression.head.yaw, expression.head.roll);
    }

    blinkRef.current -= delta;
    if (blinkRef.current <= 0) {
      blinkRef.current = 2.4 + Math.random() * 3.6;
    }
    const blinking = blinkRef.current < 0.14 ? 1 - blinkRef.current / 0.14 : 0;

    for (const target of targetsRef.current) {
      const name = target.name;
      if (!name) continue;

      let wantedInfluence = 0;
      if (wanted.has(name)) {
        wantedInfluence = 1;
      } else if (BLINK_SHAPES.includes(name)) {
        wantedInfluence = blinking;
      } else if (name in arkit) {
        wantedInfluence = arkit[name];
      }

      // The expression is added on top of the mouth, so a speaking character
      // can also be smiling or raising its brows.
      const expressionInfluence = expression.weights[name] ?? 0;
      const combined = Math.min(1, wantedInfluence + expressionInfluence);

      target.current += (combined - target.current) * Math.min(1, MORPH_STEP * delta * 60);
      const influences = target.mesh.morphTargetInfluences;
      if (influences) influences[target.index] = target.current;
    }
  });

  if (error) {
    console.warn('Avatar model unavailable:', error);
    return null;
  }
  if (!scene) return null;

  return <primitive object={scene} />;
}

/**
 * Point the camera at the face.
 *
 * The camera belongs to the stage, but the framing depends on the asset, so
 * the model frames itself once it is loaded. The eyes are the target: a head
 * mesh covers the skull and the neck, and aiming at its middle leaves the
 * face high in the frame.
 */
function frameHead(root: THREE.Object3D, camera: THREE.Camera) {
  const headBox = new THREE.Box3();
  const eyeBox = new THREE.Box3();
  let foundHead = false;
  let foundEyes = false;

  root.traverse(child => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const bounds = worldBounds(mesh);
    if (!bounds) return;

    if (!foundHead && /head|face/i.test(mesh.name)) {
      headBox.union(bounds);
      foundHead = true;
      return;
    }
    if (!foundEyes && /eye/i.test(mesh.name)) {
      eyeBox.union(bounds);
      foundEyes = true;
    }
  });

  if (!foundHead) {
    root.traverse(child => {
      if (foundHead) return;
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.morphTargetDictionary) return;
      const bounds = worldBounds(mesh);
      if (!bounds) return;
      headBox.union(bounds);
      foundHead = true;
    });
  }

  if (!foundHead) return;

  const size = headBox.getSize(new THREE.Vector3());
  const headCenter = headBox.getCenter(new THREE.Vector3());
  const distance = Math.max(0.3, size.y * 1.45);

  // The eye line is the target, with the face a little below the middle of
  // the crop, which is how a portrait is framed.
  const target = foundEyes ? eyeBox.getCenter(new THREE.Vector3()) : headCenter;
  target.y = foundEyes ? target.y - size.y * 0.06 : target.y;

  camera.position.set(target.x, target.y, target.z + distance);
  camera.lookAt(target);
  if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix();
}

/**
 * The bone that carries the head.
 *
 * A rigged avatar moves its head through the skeleton, not through the mesh,
 * so the skin follows the pose.
 */
function findHeadBone(root: THREE.Object3D): THREE.Bone | null {
  let found: THREE.Bone | null = null;
  root.traverse(child => {
    if (found) return;
    const bone = child as THREE.Bone;
    if (!bone.isBone) return;
    if (/head|neck/i.test(bone.name)) found = bone;
  });
  return found;
}

function worldBounds(mesh: THREE.Mesh): THREE.Box3 | null {
  mesh.updateWorldMatrix(true, false);
  const geometry = mesh.geometry;
  if (!geometry) return null;
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) return null;
  return bounds.clone().applyMatrix4(mesh.matrixWorld);
}
