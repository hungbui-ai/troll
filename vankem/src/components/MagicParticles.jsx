import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function MagicParticles({ handData }) {
  const mesh = useRef();
  const count = 15000; // Tăng lượng hạt để tạo độ đặc cho kiếm

  // Tạo các thuộc tính ngẫu nhiên cho từng hạt để quỹ đạo không hạt nào giống hạt nào
  const [positions, aOffset] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const o = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Khởi tạo hạt nằm rải rác trong hình cầu
      const r = 2.0 * Math.pow(Math.random(), 0.5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2.0 * Math.random() - 1.0);
      p.set([r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)], i * 3);
      // aOffset dùng để tạo độ lệch pha khi xoáy
      o.set([Math.random(), Math.random(), Math.random()], i * 3);
    }
    return [p, o];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uHandPos: { value: new THREE.Vector3() },
    uHandBase: { value: new THREE.Vector3() },
    uExpansion: { value: 0 },
    uIsTracking: { value: 0 }
  }), []);

  useFrame((state) => {
    const { clock } = state;
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uExpansion.value = THREE.MathUtils.lerp(uniforms.uExpansion.value, handData.openAmount, 0.1);
    
    // Tạo độ trễ mượt mà khi di chuyển tay (Smoothing)
    uniforms.uHandPos.value.lerp(handData.pos, 0.15);
    uniforms.uHandBase.value.lerp(handData.basePos || handData.pos, 0.15);
    uniforms.uIsTracking.value = THREE.MathUtils.lerp(uniforms.uIsTracking.value, handData.isTracking ? 1 : 0, 0.05);
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aOffset" count={count} array={aOffset} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          uniform vec3 uHandPos;
          uniform vec3 uHandBase;
          uniform float uExpansion;
          uniform float uIsTracking;
          attribute vec3 aOffset;
          varying vec3 vColor;

          void main() {
            vec3 pos = position;
            float t = uTime * 2.0;

            if(uIsTracking > 0.1) {
              // 1. Tạo trục kiếm nối từ Base tới Tip
              float lerpPart = aOffset.y; // Dùng offset y để rải hạt dọc thân kiếm
              vec3 swordPoint = mix(uHandBase, uHandPos, lerpPart * 1.5);

              // 2. Thuật toán xoáy quỹ đạo (Orbiting)
              // Các hạt sẽ xoay tròn quanh trục kiếm thay vì đứng yên
              float angle = t + aOffset.x * 6.28;
              float radius = 0.05 + aOffset.z * 0.2; // Độ dày của thân kiếm
              
              vec3 orbit = vec3(cos(angle) * radius, sin(angle) * radius, sin(angle * 0.5) * radius);
              
              // 3. Hiệu ứng hút có quán tính
              pos = mix(pos, swordPoint + orbit, 0.9 * uIsTracking);
            } else {
              // Khi không có tay, hạt bay lơ lửng chậm rãi
              pos += sin(t * aOffset + aOffset * 10.0) * 0.2;
            }

            // Hiệu ứng nổ khi xòe tay
            pos += normalize(pos) * uExpansion * 5.0;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            
            // Kích thước hạt biến thiên tạo hiệu ứng lấp lánh (Twinkle)
            float size = (8.0 + sin(t * 5.0 + aOffset.x * 10.0) * 4.0);
            gl_PointSize = size * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;

            // Màu sắc: Cyan rực rỡ pha tím ma mị
            vColor = mix(vec3(0.0, 1.0, 1.0), vec3(0.8, 0.2, 1.0), uExpansion + aOffset.z * 0.5);
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            if (d > 0.5) discard;
            // Tạo quầng sáng mềm (Soft particles)
            float f = pow(1.0 - d * 2.0, 2.0);
            gl_FragColor = vec4(vColor * f * 2.0, f);
          }
        `}
      />
    </points>
  );
}
