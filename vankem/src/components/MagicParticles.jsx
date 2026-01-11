import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

export function useHandTracking() {
  const [handData, setHandData] = useState({ openAmount: 0, pos: new THREE.Vector3(0, 0, 0), isTracking: false });
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
                // Tính độ xòe: dựa trên 4 ngón chính
                const openFingers = [8, 12, 16, 20].filter(i => l[i].y < l[i - 2].y).length;
                // LẤY ĐIỂM SỐ 8 (Đầu ngón trỏ) làm tâm điều khiển
                const x = (0.5 - l[8].x) * 12; 
                const y = (0.5 - l[8].y) * 8;
                setHandData({ openAmount: openFingers / 4, pos: new THREE.Vector3(x, y, 0), isTracking: true });
              } else {
                setHandData(prev => ({ ...prev, isTracking: false, openAmount: 0 }));
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
