'use client';

import { useEffect, useRef } from 'react';
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
}

function getOpenStatus(cafeId: number, openingHours: OpeningHour[]): boolean | null {
  const now = new Date();
  const twNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const dayOfWeek = twNow.getUTCDay() === 0 ? 7 : twNow.getUTCDay();
  const currentMinutes = twNow.getUTCHours() * 60 + twNow.getUTCMinutes();

  const todayRecord = openingHours.find(
    h => h.id === cafeId && h.day_of_week === dayOfWeek
  );

  if (!todayRecord) return null;
  if (todayRecord.is_closed) return false;

  const [openH, openM] = todayRecord.open_time.split(':').map(Number);
  const [closeH, closeM] = todayRecord.close_time.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;
  if (closeMinutes === 0) closeMinutes = 24 * 60;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

function createMarkerIcon(isOpen: boolean | null): L.DivIcon {
  const color = isOpen === true ? '#22C55E' : isOpen === false ? '#EF4444' : '#94A3B8';
  const glow = isOpen === true
    ? 'rgba(34,197,94,0.35)'
    : isOpen === false
    ? 'rgba(239,68,68,0.25)'
    : 'rgba(148,163,184,0.2)';

  return L.divIcon({
    className: '',
    html: `
      <div style="position: relative; width: 32px; height: 40px;">
        <div style="
          position: absolute; top: 0; left: 0;
          width: 32px; height: 32px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 10px ${glow}, 0 1px 4px rgba(0,0,0,0.2);
        "></div>
        <div style="
          position: absolute; top: 9px; left: 9px;
          width: 10px; height: 10px;
          background: white; border-radius: 50%; opacity: 0.9;
        "></div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -42],
  });
}

export default function Map({ cafes = [], openingHours = [] }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    console.log('openingHours count:', openingHours.length);
    if (mapRef.current) {
      mapRef.current.remove();
    }
    const map = L.map('map').setView([25.011, 121.465], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    cafes.forEach((cafe) => {
      const isOpen = getOpenStatus(cafe.id, openingHours);
      const statusLabel = isOpen === true ? '🟢 營業中' : isOpen === false ? '🔴 休息中' : '';
      const statusColor = isOpen === true ? '#16A34A' : isOpen === false ? '#DC2626' : '#64748B';

      const popupContent = `
        <div style="padding: 6px 2px; font-family: sans-serif;">
          <b style="font-size: 14px; color: #2C1A0E;">${cafe.name}</b>
          ${statusLabel ? `<div style="font-size: 11px; color: ${statusColor}; font-weight: 600; margin-top: 4px;">${statusLabel}</div>` : ''}
          <p style="font-size: 12px; color: #7A5C3A; margin-top: 4px;">${cafe.address || '暫無地址'}</p>
        </div>
      `;

      L.marker([cafe.lat, cafe.lng], { icon: createMarkerIcon(isOpen) })
        .bindPopup(popupContent)
        .addTo(mapRef.current!);
    });
  }, [cafes, openingHours]);

  return <div id="map" className="w-full h-full" />;
}