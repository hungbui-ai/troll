import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

// PHẢI CÓ TỪ KHÓA export Ở ĐÂY
export function useHandTracking() {
  const [handData, setHandData] = useState({ 
    openAmount: 0, 
    pos: new THREE.Vector3(0, 0, 0), 
    basePos: new THREE.Vector3(0, 0, 0), // Thêm điểm gốc để làm kiếm
    isTracking: false 
  });
  const videoRef = useRef(null);

  useEffect(() => {
    let handLandmarker;
    let animationFrame;
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { 
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", 
          delegate: "GPU" 
        },
        runningMode: "VIDEO", numHands: 1
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          const predict = () => {
            if (videoRef.current && handLandmarker) {
              const results = handLandmarker.detectForVideo(videoRef.current, performance.now());
              if (results.landmarks?.length > 0) {
                const l = results.landmarks[0];
                const openFingers = [8, 12, 16, 20].filter(i => l[i].y < l[i - 2].y).length;

                // Tọa độ đầu ngón trỏ (Tip) và gốc ngón trỏ (Base)
                const tip = new THREE.Vector3((0.5 - l[8].x) * 12, (0.5 - l[8].y) * 8, 0);
                const base = new THREE.Vector3((0.5 - l[5].x) * 12, (0.5 - l[5].y) * 8, 0);

                setHandData({ 
                  openAmount: openFingers / 4, 
                  pos: tip, 
                  basePos: base, 
                  isTracking: true 
                });
              } else {
                setHandData(prev => ({ ...prev, isTracking: false }));
              }
            }
            animationFrame = requestAnimationFrame(predict);
          };
          predict();
        };
      }
    };
    init();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return { videoRef, handData };
}
