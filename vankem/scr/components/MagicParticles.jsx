import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function MagicParticles({ handData }) {
  const mesh = useRef();
  const count = window.innerWidth < 768 ? 3000 : 8000;
  const [positions, randoms] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const r = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 6.28, phi = Math.acos(Math.random() * 2 - 1), dist = 1.2 + Math.random() * 0.5;
      p.set([dist * Math.sin(phi) * Math.cos(theta), dist * Math.sin(phi) * Math.sin(theta), dist * Math.cos(phi)], i * 3);
      r.set([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5], i * 3);
    }
    return [p, r];
  }, [count]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uExpansion: { value: 0 }, uHandPos: { value: new THREE.Vector3() }, uIsTracking: { value: 0 } }), []);

  useFrame((s) => {
    uniforms.uTime.value = s.clock.elapsedTime;
    uniforms.uExpansion.value = THREE.MathUtils.lerp(uniforms.uExpansion.value, handData.openAmount, 0.1);
    uniforms.uHandPos.value.lerp(handData.pos, 0.1);
    uniforms.uIsTracking.value = THREE.MathUtils.lerp(uniforms.uIsTracking.value, handData.isTracking ? 1 : 0, 0.1);
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={uniforms}
        vertexShader={`
          uniform float uTime; uniform float uExpansion; uniform vec3 uHandPos; uniform float uIsTracking;
          attribute vec3 aRandom; varying vec3 vColor;
          void main() {
            vec3 pos = position + (normalize(position) + aRandom) * uExpansion * 3.5;
            if(uIsTracking > 0.1) pos = mix(pos, uHandPos + aRandom * 0.5, 0.4 * uIsTracking);
            gl_PointSize = (4.0 + uExpansion * 10.0) * (1.0 / - (modelViewMatrix * vec4(pos, 1.0)).z);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            vColor = mix(vec3(0.0, 1.0, 0.5), vec3(1.0, 0.3, 0.0), uExpansion);
          }
        `}
        fragmentShader="varying vec3 vColor; void main() { float r = distance(gl_PointCoord, vec2(0.5)); if (r > 0.5) discard; gl_FragColor = vec4(vColor * pow(1.0 - r*2.0, 1.5), 1.0); }"
      />
    </points>
  );
}
