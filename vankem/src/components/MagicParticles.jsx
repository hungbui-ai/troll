import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function MagicParticles({ handData }) {
  const mesh = useRef();
  const count = 20000; // Tăng lên 2 vạn hạt để kiếm đặc rực rỡ

  const [positions, aOffset] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const o = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p.set([(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10], i * 3);
      o.set([Math.random(), Math.random(), Math.random()], i * 3);
    }
    return [p, o];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uHandPos: { value: new THREE.Vector3() },
    uHandBase: { value: new THREE.Vector3() },
    uIsTracking: { value: 0 },
    uOpen: { value: 0 }
  }), []);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uHandPos.value.lerp(handData.pos, 0.1); // Tạo độ trễ (Damping)
    uniforms.uHandBase.value.lerp(handData.basePos, 0.1);
    uniforms.uIsTracking.value = THREE.MathUtils.lerp(uniforms.uIsTracking.value, handData.isTracking ? 1 : 0, 0.05);
    uniforms.uOpen.value = THREE.MathUtils.lerp(uniforms.uOpen.value, handData.openAmount, 0.1);
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aOffset" count={count} array={aOffset} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={uniforms}
        vertexShader={`
          uniform float uTime; uniform vec3 uHandPos; uniform vec3 uHandBase; 
          uniform float uIsTracking; uniform float uOpen;
          attribute vec3 aOffset; varying vec3 vColor;

          void main() {
            vec3 pos = position;
            float t = uTime * 3.0;

            if(uIsTracking > 0.1) {
              // 1. Ép hạt vào trục kiếm (Nối từ Base đến Tip và kéo dài gấp đôi)
              vec3 dir = normalize(uHandPos - uHandBase);
              vec3 swordPoint = uHandBase + dir * aOffset.y * 5.0; 

              // 2. Thuật toán xoáy ma thuật (Spiral Flow)
              float angle = t * 5.0 + aOffset.x * 6.28;
              float radius = 0.03 + aOffset.z * 0.15; // Kiếm rất đặc ở lõi
              vec3 spiral = vec3(cos(angle) * radius, sin(angle) * radius, cos(angle * 0.5) * radius);
              
              // 3. Hút hạt có quán tính
              pos = mix(pos, swordPoint + spiral, 0.92 * uIsTracking);
            } else {
              // Bay lơ lửng khi không có tay
              pos += sin(t * 0.5 + aOffset * 20.0) * 0.1;
            }

            // Hiệu ứng bùng nổ khi xòe tay
            pos += normalize(pos - uHandBase) * uOpen * 3.0;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = (6.0 + sin(t + aOffset.x * 10.0) * 4.0) * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;

            // Màu Cyan pha lê cực sáng
            vColor = mix(vec3(0.0, 1.0, 1.0), vec3(0.5, 0.0, 1.0), aOffset.x);
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 3.0);
            gl_FragColor = vec4(vColor * glow * 3.0, glow);
          }
        `}
      />
    </points>
  );
}
