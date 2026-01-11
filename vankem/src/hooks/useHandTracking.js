// Tìm đoạn tính toán tọa độ x, y trong file useHandTracking.js và sửa thành:
if (results.landmarks?.length > 0) {
  const l = results.landmarks[0];
  const openFingers = [8, 12, 16, 20].filter(i => l[i].y < l[i - 2].y).length;

  // Tọa độ đầu ngón trỏ (Tip)
  const tip = new THREE.Vector3((0.5 - l[8].x) * 12, (0.5 - l[8].y) * 8, 0);
  // Tọa độ gốc ngón trỏ (Base) 
  const base = new THREE.Vector3((0.5 - l[5].x) * 12, (0.5 - l[5].y) * 8, 0);

  setHandData({ 
    openAmount: openFingers / 4, 
    pos: tip,      // Đầu kiếm
    basePos: base, // Gốc kiếm
    isTracking: true 
  });
}
