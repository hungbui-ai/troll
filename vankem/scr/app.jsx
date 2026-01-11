import { Canvas } from '@react-three/fiber';
import MagicParticles from './components/MagicParticles';
import { useHandTracking } from './hooks/useHandTracking';

export default function App() {
  const { videoRef, handData } = useHandTracking();
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', bottom: 20, right: 20, width: 120, borderRadius: 12, transform: 'scaleX(-1)', opacity: 0.5, zIndex: 10, border: '1px solid #fff' }} />
      <Canvas camera={{ position: [0, 0, 6] }}>
        <MagicParticles handData={handData} />
      </Canvas>
    </div>
  );
}
