import { useState} from 'react';

type LocationState = {
  lat: number;
  lng: number;
} | null;

type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error' | 'denied';

export function useGeolocation() {
  const [location, setLocation] = useState<LocationState>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg('您的裝置不支援定位功能');
      return;
    }

    setStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('success');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          setErrorMsg('請允許瀏覽器存取您的位置');
        } else {
          setStatus('error');
          setErrorMsg('定位失敗，請稍後再試');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return { location, status, errorMsg, requestLocation };
}