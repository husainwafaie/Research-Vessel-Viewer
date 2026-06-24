import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useSceneStore } from '@store/scene.store';
import { vessel } from '@data/vessel';

/**
 * CameraController — owns all camera movement.
 *
 * Modes (from scene store):
 *   free    → OrbitControls active, user drives
 *   focused → lerp to component camera target, then orbit constrained
 *   tour    → programmatic sequence (implemented in Milestone 1.9)
 *
 * The lerp approach (vs. tween library) keeps us inside useFrame,
 * avoiding external animation timers that can desync from the render loop.
 */

const LERP_SPEED = 2.5; // units per second feel — higher = snappier transition
const LERP_EPSILON = 0.001; // stop lerping when this close

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const cameraTarget    = useSceneStore((s) => s.cameraTarget);
  const isTransitioning = useSceneStore((s) => s.isTransitioning);
  const setTransitioning = useSceneStore((s) => s.setTransitioning);
  const isUnderwater    = useSceneStore((s) => s.cameraMode === 'underwater');

  // Internal lerp targets — we drive these in useFrame
  const lerpPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const lerpTgt = useRef<THREE.Vector3>(new THREE.Vector3());

  // On mount, set initial orbit target to vessel center
  useEffect(() => {
    if (!controlsRef.current) return;
    const defaultCam = vessel.defaultCamera;
    camera.position.set(...defaultCam.position);
    controlsRef.current.target.set(...defaultCam.target);
    controlsRef.current.update();
  }, [camera]);

  // When a new camera target is set (component focus or reset), initialise lerp
  useEffect(() => {
    if (!cameraTarget || !isTransitioning) return;
    lerpPos.current.copy(camera.position);
    lerpTgt.current.copy(
      controlsRef.current
        ? controlsRef.current.target
        : new THREE.Vector3(0, 0, 0),
    );
  }, [cameraTarget, isTransitioning, camera]);

  useFrame((_, delta) => {
    if (!cameraTarget || !isTransitioning || !controlsRef.current) return;

    const targetPos = new THREE.Vector3(...cameraTarget.position);
    const targetTgt = new THREE.Vector3(...cameraTarget.target);

    // Lerp camera position
    lerpPos.current.lerp(targetPos, Math.min(1, LERP_SPEED * delta));
    lerpTgt.current.lerp(targetTgt, Math.min(1, LERP_SPEED * delta));

    camera.position.copy(lerpPos.current);
    controlsRef.current.target.copy(lerpTgt.current);
    controlsRef.current.update();

    // Settle check — stop lerping once close enough
    const posErr = lerpPos.current.distanceTo(targetPos);
    const tgtErr = lerpTgt.current.distanceTo(targetTgt);
    if (posErr < LERP_EPSILON && tgtErr < LERP_EPSILON) {
      setTransitioning(false);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      // Disable user input during programmatic transitions
      enabled={!isTransitioning}
      // Zoom limits — much tighter range underwater (close hull inspection)
      minDistance={isUnderwater ? 5  : 18}
      maxDistance={isUnderwater ? 120 : 350}
      // Vertical limits:
      //   Surface — block camera from going below waterline or straight overhead
      //   Underwater — allow full vertical range so user can look up at hull keel
      minPolarAngle={isUnderwater ? 0            : 0.08}
      maxPolarAngle={isUnderwater ? Math.PI * 0.95 : Math.PI * 0.47}
      // Rotate speed
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      panSpeed={0.6}
    />
  );
}
