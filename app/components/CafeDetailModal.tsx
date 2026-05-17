//燈箱
'use client';

interface Cafe {
  name: string;
  address?: string;
  image_url?: string;
  google_maps_url?: string;
  rating?: number;
}

export default function CafeDetailModal({ 
  cafe, 
  onClose 
}: { 
  cafe: Cafe | null; 
  onClose: () => void 
}) {
  if (!cafe) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div 
        style={{
          background: '#FDF8F2', width: '90%', maxWidth: '400px', borderRadius: '24px',
          overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          position: 'relative', animation: 'modalIn 0.3s ease-out'
        }} 
        onClick={e => e.stopPropagation()} // 防止點擊卡片內部也關閉
      >
        {cafe.image_url && (
          <img src={cafe.image_url} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
        )}
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontFamily: 'Noto Serif TC', fontSize: '22px', color: '#2C1A0E', marginBottom: '8px' }}>
            {cafe.name}
          </h2>
          <p style={{ fontSize: '14px', color: '#7A5C3A', marginBottom: '16px' }}>{cafe.address}</p>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <a 
              href={cafe.google_maps_url} 
              target="_blank" 
              style={{
                flex: 1, textAlign: 'center', background: '#2C1A0E', color: '#C9A87C',
                padding: '12px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold'
              }}
            >
              開啟地圖導航
            </a>
            <button 
              onClick={onClose}
              style={{
                padding: '12px 20px', borderRadius: '12px', border: '1px solid #C9A87C',
                background: 'transparent', color: '#7A5C3A', cursor: 'pointer'
              }}
            >
              關閉
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}