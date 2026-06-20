import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { VesselComponent, Vector3Tuple, CameraTarget } from '@domain/types';
import { useComponentFocus } from '@hooks/useComponentFocus';
import { CATEGORY_CONFIG } from '@data/categoryConfig';
import { getComponentSystem } from '@domain/selectors';
import { vessel } from '@data/vessel';

interface HotspotMarkerProps {
  component: VesselComponent;
  position: Vector3Tuple;
  cameraOverride?: CameraTarget | undefined;
}

const IDLE_COLOR  = new THREE.Color('#0ea5e9');
const HOVER_COLOR = new THREE.Color('#7dd3fc');
const ACTIVE_COLOR = new THREE.Color('#ffffff');

export function HotspotMarker({ component, position, cameraOverride }: HotspotMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const { focus, selectedId }  = useComponentFocus();
  const isSelected = selectedId === component.id;

  const coreRef  = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const colorRef = useRef(IDLE_COLOR.clone());

  const system = getComponentSystem(vessel, component.id);
  const catColor = system
    ? new THREE.Color(CATEGORY_CONFIG[system.category].color)
    : IDLE_COLOR;

  useFrame(({ clock }) => {
    if (!coreRef.current || !pulseRef.current) return;

    // Smooth color lerp based on state
    const target = isSelected ? ACTIVE_COLOR : hovered ? HOVER_COLOR : catColor;
    colorRef.current.lerp(target, 0.12);
    (coreRef.current.material as THREE.MeshBasicMaterial).color.copy(colorRef.current);

    // Pulse ring: expand and fade on a repeating cycle
    const t = (clock.getElapsedTime() * 0.7) % 1;
    const scale = 1 + t * 1.8;
    pulseRef.current.scale.setScalar(scale);
    (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
      (1 - t) * (isSelected ? 0.7 : 0.35);
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        focus(component.id, cameraOverride);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Pulse ring */}
      <mesh ref={pulseRef}>
        <torusGeometry args={[0.9, 0.06, 8, 32]} />
        <meshBasicMaterial
          color={catColor}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* Core sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color={catColor} />
      </mesh>

      {/* Hover / selected label */}
      {(hovered || isSelected) && (
        <Html
          center
          distanceFactor={80}
          style={{ pointerEvents: 'none' }}
          position={[0, 1.6, 0]}
        >
          <div
            style={{
              background: 'rgba(2, 12, 27, 0.88)',
              border: `1px solid ${CATEGORY_CONFIG[system?.category ?? 'navigation'].color}40`,
              backdropFilter: 'blur(8px)',
              borderRadius: '4px',
              padding: '4px 10px',
              whiteSpace: 'nowrap',
              color: '#e2e8f0',
              fontSize: '11px',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            {component.name}
          </div>
        </Html>
      )}
    </group>
  );
}
