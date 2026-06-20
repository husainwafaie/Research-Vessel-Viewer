import { useRef, useEffect } from 'react';
import { Sky } from '@react-three/drei';
import type { Sky as SkyImpl } from 'three-stdlib';
import * as THREE from 'three';
import { SUN_POSITION } from './sunConfig';

export function VesselSky() {
  const skyRef = useRef<SkyImpl>(null);

  useEffect(() => {
    if (!skyRef.current) return;
    // The Sky sphere sits at the far end of the fog curve — it gets completely
    // washed out to the fog colour. Disabling fog on the material lets the
    // atmospheric shader show its full colour gradient.
    const mat = skyRef.current.material as THREE.ShaderMaterial;
    mat.fog = false;
  }, []);

  return (
    <Sky
      ref={skyRef}
      distance={450000}
      sunPosition={SUN_POSITION}
      turbidity={8}
      rayleigh={1.5}
      mieCoefficient={0.005}
      mieDirectionalG={0.8}
    />
  );
}
