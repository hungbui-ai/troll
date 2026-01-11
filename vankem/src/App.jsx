import { Canvas } from '@react-three/fiber';
import MagicParticles from './components/MagicParticles';
import { useHandTracking } from './hooks/useHandTracking';

export default function App() {
  const { videoRef, handData } = useHandTracking();

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', touchAction: 'none' }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', bottom: 20, right: 20, width: 120, borderRadius: 12, transform: 'scaleX(-1)', opacity: 0.4, zIndex: 10, border: '1px solid rgba(255,255,255,0.3)' }} />
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <color attach="background" args={['#000']} />
        <MagicParticles handData={handData} />
      </Canvas>
      <div style={{ position: 'absolute', bottom: '15%', width: '100%', textAlign: 'center', color: '#fff', opacity: 0.3, pointerEvents: 'none', fontSize: '12px' }}>
        {handData.isTracking ? "MA THUẬT ĐÃ SẴN SÀNG" : "ĐANG TẢI AI..."}
      </div>
    </div>
  );
}
