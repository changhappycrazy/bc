'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type OpeningHour = {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

interface MapProps {
  cafes?: Array<{
    id: number;
    name: string;
    address: string | null;
    lat: number;
    lng: number;
  }>;
  openingHours?: OpeningHour[];
  userLocation?: { lat: number; lng: number } | null;
}

function getOpenStatus(cafeId: number, openingHours: OpeningHour[]): boolean | null {
  const now = new Date();
  const twNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const dayOfWeek = twNow.getUTCDay() === 0 ? 7 : twNow.getUTCDay();
  const currentMinutes = twNow.getUTCHours() * 60 + twNow.getUTCMinutes();
  const todayRecord = openingHours.find(h => h.id === cafeId && h.day_of_week === dayOfWeek);
  if (!todayRecord) return null;
  if (todayRecord.is_closed) return false;
  const [openH, openM] = todayRecord.open_time.split(':').map(Number);
  const [closeH, closeM] = todayRecord.close_time.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;
  if (closeMinutes === 0) closeMinutes = 24 * 60;
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createMarkerIcon(isOpen: boolean | null, dimmed = false): L.DivIcon {
  const color = dimmed
    ? '#CBD5E1'
    : isOpen === true ? '#22C55E' : isOpen === false ? '#EF4444' : '#94A3B8';
  const glow = dimmed ? 'rgba(0,0,0,0.05)' : isOpen === true
    ? 'rgba(34,197,94,0.35)' : isOpen === false
    ? 'rgba(239,68,68,0.25)' : 'rgba(148,163,184,0.2)';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:32px;height:40px;opacity:${dimmed ? 0.3 : 1};">
        <div style="
          position:absolute;top:0;left:0;width:32px;height:32px;
          background:${color};border:3px solid white;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          box-shadow:0 3px 10px ${glow},0 1px 4px rgba(0,0,0,0.2);
        "></div>
        <div style="
          position:absolute;top:9px;left:9px;width:10px;height:10px;
          background:white;border-radius:50%;opacity:0.9;
        "></div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -42],
  });
}

// 小人圖示
const userIcon = L.divIcon({
  className: '',
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(59,130,246,0.5));">
      <div style="font-size:28px;line-height:1;">🧍</div>
      <div style="
        width:8px;height:8px;background:#3B82F6;border-radius:50%;
        box-shadow:0 0 0 4px rgba(59,130,246,0.2);margin-top:-2px;
      "></div>
    </div>
  `,
  iconSize: [32, 44],
  iconAnchor: [16, 44],
  popupAnchor: [0, -46],
});

export default function Map({ cafes = [], openingHours = [], userLocation = null }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [radiusKm, setRadiusKm] = useState(1);

  // 初始化地圖
  useEffect(() => {
    if (mapRef.current) mapRef.current.remove();
    const map = L.map('map').setView([25.011, 121.465], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
  }, []);

  // 使用者位置標記 + 圓圈
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // 移除舊的
    if (userMarkerRef.current) userMarkerRef.current.remove();
    if (circleRef.current) circleRef.current.remove();

    // 小人標記
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .bindPopup('<b>📍 您在這裡</b>')
      .addTo(mapRef.current);

    // 範圍圓圈
    circleRef.current = L.circle([userLocation.lat, userLocation.lng], {
      radius: radiusKm * 1000,
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 0.06,
      weight: 2,
      dashArray: '6 4',
    }).addTo(mapRef.current);

    // 移動地圖到使用者位置
    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.2 });
  }, [userLocation, radiusKm]);

  // 咖啡廳標記（依距離決定是否變灰）
  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer !== userMarkerRef.current) {
        mapRef.current?.removeLayer(layer);
      }
    });

    cafes.forEach((cafe) => {
  if (!cafe.lat || !cafe.lng) return;
  const isOpen = getOpenStatus(cafe.id, openingHours);
      const dimmed = userLocation
        ? getDistanceKm(userLocation.lat, userLocation.lng, cafe.lat, cafe.lng) > radiusKm
        : false;

      const statusLabel = isOpen === true ? '🟢 營業中' : isOpen === false ? '🔴 休息中' : '';
      const statusColor = isOpen === true ? '#16A34A' : isOpen === false ? '#DC2626' : '#64748B';

      const popupContent = `
        <div style="padding:6px 2px;font-family:sans-serif;">
          <b style="font-size:14px;color:#2C1A0E;">${cafe.name}</b>
          ${statusLabel ? `<div style="font-size:11px;color:${statusColor};font-weight:600;margin-top:4px;">${statusLabel}</div>` : ''}
          <p style="font-size:12px;color:#7A5C3A;margin-top:4px;">${cafe.address || '暫無地址'}</p>
          ${userLocation ? `<p style="font-size:11px;color:#C9A87C;margin-top:2px;">📍 距離 ${getDistanceKm(userLocation.lat, userLocation.lng, cafe.lat, cafe.lng).toFixed(1)} 公里</p>` : ''}
        </div>
      `;

      L.marker([cafe.lat, cafe.lng], { icon: createMarkerIcon(isOpen, dimmed) })
        .bindPopup(popupContent)
        .addTo(mapRef.current!);
    });
  }, [cafes, openingHours, userLocation, radiusKm]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id="map" className="w-full h-full" />

      {/* 距離調整滑桿 */}
      {userLocation && (
        <div style={{
          position: 'absolute', top: 16, right: 16, zIndex: 1000,
          background: 'white', borderRadius: 16, padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          fontFamily: 'sans-serif', minWidth: 180,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2C1A0E', marginBottom: 8 }}>
            📍 附近範圍：{radiusKm} 公里
          </div>
          <input
            type="range"
            min={0.5} max={5} step={0.5}
            value={radiusKm}
            onChange={e => setRadiusKm(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#3B82F6' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
            <span>0.5km</span><span>5km</span>
          </div>
        </div>
      )}
    </div>
  );
}