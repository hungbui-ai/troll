import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import MagicParticles from './components/MagicParticles';
import { useHandTracking } from './hooks/useHandTracking';

export default function App() {
  const { videoRef, handData } = useHandTracking();

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#000', 
      margin: 0, 
      overflow: 'hidden',
      touchAction: 'none' 
    }}>
      {/* Giữ lại thẻ video để AI vẫn đọc được hình ảnh, nhưng ẩn hoàn toàn khỏi màn hình */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        style={{ 
          display: 'none' // Ẩn hoàn toàn ô camera
        }} 
      />

      <Canvas 
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 2]} 
      >
        <color attach="background" args={['#000']} />
        
        <Suspense fallback={null}>
          <MagicParticles handData={handData} />
        </Suspense>
      </Canvas>

      {/* Thông báo nhỏ khi chưa nhận diện được tay, sẽ tự ẩn khi có tay */}
      {!handData.isTracking && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#00ffff', 
          fontFamily: 'sans-serif',
          fontSize: '12px',
          letterSpacing: '2px',
          textShadow: '0 0 10px #00ffff',
          pointerEvents: 'none',
          textAlign: 'center'
        }}>
          ĐANG KHỞI TẠO PHÉP THUẬT...<br/>
          (VUI LÒNG CHO PHÉP CAMERA)
        </div>
      )}
    </div>
  );
}
