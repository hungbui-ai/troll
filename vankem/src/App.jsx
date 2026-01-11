import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import MagicParticles from './components/MagicParticles';
import { useHandTracking } from './hooks/useHandTracking';

export default function App() {
  // Lấy dữ liệu từ hook đã sửa (có chứa pos và basePos)
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
      {/* Video preview nhỏ ở góc để kiểm tra camera */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        style={{ 
          position: 'absolute', 
          bottom: 20, 
          right: 20, 
          width: 130, 
          height: 'auto',
          borderRadius: 15, 
          transform: 'scaleX(-1)', // Lật gương video cho tự nhiên
          opacity: 0.4, 
          zIndex: 10, 
          border: '2px solid rgba(255,255,255,0.2)',
          pointerEvents: 'none'
        }} 
      />

      {/* Sân khấu 3D nơi ma thuật diễn ra */}
      <Canvas 
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 2]} // Tăng độ nét cho màn hình Retina/High-res
      >
        <color attach="background" args={['#000']} />
        
        <Suspense fallback={null}>
          {/* Truyền toàn bộ handData vào để MagicParticles xử lý quỹ đạo xoáy */}
          <MagicParticles handData={handData} />
        </Suspense>
      </Canvas>

      {/* Hướng dẫn trạng thái cho người dùng */}
      <div style={{ 
        position: 'absolute', 
        top: '10%', 
        width: '100%', 
        textAlign: 'center', 
        color: '#00ffff', 
        fontFamily: 'sans-serif',
        fontSize: '14px',
        letterSpacing: '2px',
        textShadow: '0 0 10px #00ffff',
        pointerEvents: 'none',
        opacity: handData.isTracking ? 0.5 : 1
      }}>
        {handData.isTracking ? "PHÙ THỦY ĐANG ĐIỀU KHIỂN" : "GIƠ TAY TRƯỚC CAMERA ĐỂ TRIỆU HỒI KIẾM"}
      </div>

      {/* Hiệu ứng mờ ảo (Vignette) cho góc màn hình */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        boxShadow: 'inset 0 0 150px rgba(0,0,0,1)',
        pointerEvents: 'none'
      }} />
    </div>
  );
}
