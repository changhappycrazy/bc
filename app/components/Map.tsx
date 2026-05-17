'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 解決 Leaflet 預設圖示路徑問題
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  cafes?: Array<{
    id: number;
    name: string;
    address: string | null;
    lat: number;
    lng: number;
  }>;
}

export default function Map({ cafes = [] }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // 建立地圖（只執行一次）
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.remove();
    }

    // 建立地圖，中心點設在板橋車站
    const map = L.map('map').setView([25.011, 121.465], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
  }, []);

  // 當 cafes 資料變動時，更新標記
  useEffect(() => {
    if (!mapRef.current) return;

    // 清除舊標記
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // 加入新標記
    cafes.forEach((cafe) => {
      // 簡化後的彈窗：只顯示店名與地址，因為評論已移至側邊欄
      const popupContent = `
        <div style="padding: 4px;">
          <b style="font-size: 14px; color: #2C1A0E;">${cafe.name}</b>
          <p style="font-size: 12px; color: #666; margin-top: 4px;">${cafe.address || '暫無地址'}</p>
        </div>
      `;

      L.marker([cafe.lat, cafe.lng])
        .bindPopup(popupContent)
        .addTo(mapRef.current!);
    });
  }, [cafes]);

  return <div id="map" className="w-full h-full" />;
}