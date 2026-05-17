'use client';
import Link from 'next/link'; 
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '../utils/supabase/client';
import type { User } from '@supabase/supabase-js';
 
import ReviewForm from './components/ReviewForm';
import ReviewList from './components/ReviewList';
 
const Map = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-[#F5F0E8]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#C9A87C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-serif font-bold text-[#7A5C3A]">☕ 地圖正在沖煮中...</p>
      </div>
    </div>
  )
});
 
const supabase = createClient();
 
type Cafe = {
  id: number;
  name: string;
  full_name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  light: number | null;
  review_count: number | null;
  price_range: string | null;
  hours: string | null;
  image_url: string | null;
  google_maps_url: string | null;
  delivery: boolean | null;
  wifi: boolean | null;
  has_outlet: boolean | null;
  is_pet_friendly: boolean | null;
  is_no_time_limit: boolean | null;
  tags: string[];
};
 
type OpeningHour = {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};
 
const tagStyle: React.CSSProperties = {
  fontSize: 10, padding: '2px 8px', borderRadius: 20,
  background: '#F5F0E8', color: '#7A5C3A', border: '1px solid rgba(201,168,124,0.4)'
};
 
const tagActiveStyle: React.CSSProperties = {
  ...tagStyle,
  background: '#2C1A0E', color: '#C9A87C', border: '1px solid #2C1A0E', cursor: 'pointer'
};
 
const tagClickStyle: React.CSSProperties = {
  ...tagStyle, cursor: 'pointer'
};
 
function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F59E0B', fontSize: 13, fontWeight: 700 }}>
      ★ {rating.toFixed(1)}
    </span>
  );
}
 
function OpeningHoursBlock({ cafeId, openingHours }: { cafeId: number; openingHours: OpeningHour[] }) {
  const [expanded, setExpanded] = useState(false);
 
  const DAY_NAMES = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'];
 
  const now = new Date();
  const twNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const todayDow = twNow.getUTCDay() === 0 ? 7 : twNow.getUTCDay();
 
  const cafeHours = openingHours
    .filter(h => h.id === cafeId)
    .sort((a, b) => a.day_of_week - b.day_of_week);
 
  const todayRecord = cafeHours.find(h => h.day_of_week === todayDow);
 
  const formatTime = (t: string) => t.slice(0, 5);
 
  const todayLabel = todayRecord
    ? todayRecord.is_closed
      ? '今日公休'
      : `${formatTime(todayRecord.open_time)} – ${formatTime(todayRecord.close_time)}`
    : null;
 
  if (!todayLabel && cafeHours.length === 0) return null;
 
  return (
    <div style={{ marginTop: 10 }}>
      {/* 今日時段列 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#7A5C3A' }}>🕐</span>
        <span style={{
          fontSize: 13, color: todayRecord?.is_closed ? '#DC2626' : '#7A5C3A', fontWeight: 600
        }}>
          {todayLabel ?? '無營業資料'}
        </span>
        {cafeHours.length > 0 && (
          <button
            onClick={() => setExpanded(p => !p)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px 6px', borderRadius: 6,
              color: '#C9A87C', fontSize: 12, fontWeight: 700,
              transition: 'transform 0.2s',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              display: 'flex', alignItems: 'center',
            }}
            title="查看整週營業時間"
          >
            ▾
          </button>
        )}
      </div>
 
      {/* 展開的整週表 */}
      {expanded && (
        <div style={{
          marginTop: 8, background: 'white', borderRadius: 12,
          border: '1px solid rgba(201,168,124,0.2)',
          overflow: 'hidden', fontSize: 12,
        }}>
          {[1,2,3,4,5,6,7].map(dow => {
            const rec = cafeHours.find(h => h.day_of_week === dow);
            const isToday = dow === todayDow;
            return (
              <div key={dow} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 14px',
                background: isToday ? 'rgba(201,168,124,0.08)' : 'transparent',
                borderLeft: isToday ? '3px solid #C9A87C' : '3px solid transparent',
              }}>
                <span style={{ color: isToday ? '#2C1A0E' : '#7A5C3A', fontWeight: isToday ? 700 : 400 }}>
                  {DAY_NAMES[dow]}
                </span>
                <span style={{ color: !rec || rec.is_closed ? '#DC2626' : '#4A3728', fontWeight: isToday ? 700 : 400 }}>
                  {!rec ? '—' : rec.is_closed ? '公休' : `${formatTime(rec.open_time)} – ${formatTime(rec.close_time)}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
 
export default function Home() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [filterDelivery, setFilterDelivery] = useState(false);
  const [filterPet, setFilterPet] = useState(false);
  const [filterNoTimeLimit, setFilterNoTimeLimit] = useState(false);
  const [filterMRT, setFilterMRT] = useState(false);
  const [filterOutlet, setFilterOutlet] = useState(false);
  const [filterSpecialty, setFilterSpecialty] = useState(false);
  const [filterPourOver, setFilterPourOver] = useState(false);
  const [filterPrices, setFilterPrices] = useState<string[]>([]);
  
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
  const [isEditing, setIsEditing] = useState(false);
 
  useEffect(() => {
    const checkUser = async () => {
      setAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setNickname(currentUser.user_metadata.display_name || currentUser.user_metadata.full_name || '咖啡愛好者');
      }
      setAuthLoading(false);
    };
 
    checkUser();
 
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setNickname(currentUser.user_metadata.display_name || currentUser.user_metadata.full_name || '咖啡愛好者');
      }
    });
 
    async function fetchCafes() {
      setLoading(true);
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .order('rating', { ascending: false });
      if (error) console.error('Supabase error:', error);
      else setCafes(data || []);
      setLoading(false);
    }
 
    async function fetchOpeningHours() {
      const { data, error } = await supabase.from('opening_hours').select('*');
      if (error) console.error('Opening hours error:', error);
      else setOpeningHours(data || []);
    }
 
    fetchCafes();
    fetchOpeningHours();
 
    return () => subscription.unsubscribe();
  }, []);
 
  const isOpenNow = (cafeId: number): boolean | null => {
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
  };
 
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };
 
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
 
  const updateNickname = async () => {
    if (!user) return;
    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: nickname }
    });
    if (authError) {
      alert('更新失敗：' + authError.message);
      return;
    }
    const { error: reviewError } = await supabase
      .from('cafe_reviews')
      .update({ user_name: nickname })
      .eq('user_id', user.id);
    if (reviewError) {
      alert('暱稱已更新，但評論同步失敗：' + reviewError.message);
    } else {
      setIsEditing(false);
      alert('暱稱與評論已同步更新！');
    }
  };
 
  const filtered = cafes.filter(c => {
    if (searchTerm) {
      const tokens = searchTerm.toLowerCase().split(/[\s\u3000，,、。！!？?]+/).filter(Boolean);
      const target = (c.name + (c.full_name || '') + (c.address || '')).toLowerCase();
      const match = tokens.every(token => target.includes(token));
      if (!match) return false;
    }
    if (filterDelivery && !c.delivery) return false;
    if (filterPet && !c.is_pet_friendly) return false;
    if (filterNoTimeLimit && !c.is_no_time_limit) return false;
    if (filterMRT && !c.tags?.includes('近捷運站')) return false;
    if (filterOutlet && !c.has_outlet) return false;
    if (filterSpecialty && !c.tags?.includes('精品咖啡')) return false;
    if (filterPourOver && !c.tags?.includes('手沖咖啡')) return false;
    if (filterPrices.length > 0 && (!c.price_range || !filterPrices.includes(c.price_range))) return false;
    return true;
  });
 
  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0E8', color: '#2C1A0E' }}>
        <p className="font-serif font-bold">☕ 正在準備您的咖啡清單...</p>
      </div>
    );
  }
 
  if (!user) {
    return (
      <div className="login-gate">
        <style>{`
          .login-gate { height: 100vh; display: flex; align-items: center; justify-content: center; background: #F5F0E8; font-family: 'Noto Serif TC', serif; }
          .login-card { background: white; padding: 60px 40px; border-radius: 32px; box-shadow: 0 20px 60px rgba(44,26,14,0.1); text-align: center; max-width: 420px; width: 90%; }
          .login-title { font-size: 28px; color: #2C1A0E; margin-bottom: 16px; font-weight: 700; }
          .login-desc { font-size: 15px; color: #7A5C3A; margin-bottom: 35px; line-height: 1.8; }
          .big-login-btn { background: #2C1A0E; color: #C9A87C; padding: 16px; border-radius: 16px; border: none; font-weight: 700; cursor: pointer; width: 100%; font-size: 16px; transition: all 0.3s; box-shadow: 0 4px 15px rgba(44,26,14,0.2); }
          .big-login-btn:hover { opacity: 0.9; transform: translateY(-3px); box-shadow: 0 6px 20px rgba(44,26,14,0.3); }
        `}</style>
        <div className="login-card">
          <h1 className="login-title">板橋咖啡廳地圖</h1>
          <p className="login-desc">歡迎來到您的私人咖啡地圖！<br/>請先登入以存取專屬推薦地點。</p>
          <button className="big-login-btn" onClick={handleLogin}>一鍵 Google 註冊 / 登入</button>
        </div>
      </div>
    );
  }
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --cream: #F5F0E8; --espresso: #2C1A0E; --latte: #C9A87C; --foam: #FDF8F2; --bark: #7A5C3A; --shadow: rgba(44,26,14,0.08); }
        body { font-family: 'Lato', sans-serif; background: var(--cream); color: var(--espresso); }
        .sidebar { width: 320px; min-width: 320px; background: var(--foam); border-right: 1px solid rgba(201,168,124,0.2); display: flex; flex-direction: column; overflow: hidden; }
        .sidebar-header { padding: 30px 24px 24px; border-bottom: 1px solid rgba(201,168,124,0.2); background: var(--espresso); }
        .brand-title { font-family: 'Noto Serif TC', serif; font-size: 22px; font-weight: 700; color: var(--latte); letter-spacing: 0.05em; }
        .brand-sub { font-size: 10px; color: rgba(201,168,124,0.5); letter-spacing: 0.2em; text-transform: uppercase; margin-top: 4px; }
        .auth-section { padding: 14px 20px; border-bottom: 1px solid rgba(201,168,124,0.15); display: flex; align-items: center; justify-content: space-between; background: white; }
        .user-info { display: flex; align-items: center; gap: 12px; }
        .user-avatar { width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid var(--latte); }
        .user-name { font-size: 13px; color: var(--espresso); font-weight: 700; }
        .edit-link { font-size: 10px; color: var(--latte); cursor: pointer; text-decoration: underline; margin-top: 1px; }
        .auth-btn { padding: 6px 12px; border-radius: 8px; font-size: 11px; cursor: pointer; border: none; font-weight: 600; }
        .logout-btn { background: #F8F4EF; color: #999; transition: all 0.2s; }
        .logout-btn:hover { background: #EEE; color: #666; }
        .search-wrap { padding: 18px 20px 12px; }
        .search-input { width: 100%; padding: 12px 16px; border: 1.5px solid rgba(201,168,124,0.3); border-radius: 12px; font-size: 14px; outline: none; transition: all 0.2s; }
        .search-input:focus { border-color: var(--latte); box-shadow: 0 0 0 3px rgba(201,168,124,0.1); }
        .filter-section { padding: 12px 20px; }
        .filter-label { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--bark); font-weight: 700; margin-bottom: 10px; opacity: 0.7; }
        .toggle-btn { padding: 6px 14px; border-radius: 20px; border: 1.5px solid rgba(201,168,124,0.3); font-size: 11px; cursor: pointer; background: white; transition: all 0.2s; }
        .toggle-btn.active { background: var(--espresso); color: var(--latte); border-color: var(--espresso); }
        .cafe-count { padding: 15px 20px 5px; font-size: 11px; color: var(--bark); font-weight: 600; }
        .cafe-list { flex: 1; overflow-y: auto; padding: 10px 0 20px; }
        .cafe-card { margin: 8px 16px; border-radius: 16px; border: 1.5px solid transparent; cursor: pointer; background: white; box-shadow: 0 2px 10px var(--shadow); overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .cafe-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px var(--shadow); }
        .cafe-card.selected { border-color: var(--latte); background: #FFFBFA; }
        .cafe-card-img { width: 100%; height: 90px; object-fit: cover; }
        .cafe-card-body { padding: 12px 15px; }
        .cafe-card-name { font-family: 'Noto Serif TC', serif; font-size: 14px; font-weight: 700; margin-bottom: 6px; line-height: 1.4; }
        .map-area { flex: 1; position: relative; border-radius: 20px 0 0 20px; overflow: hidden; margin-top: 10px; margin-bottom: 10px; box-shadow: -10px 0 30px rgba(0,0,0,0.05); }
        .detail-panel { width: 360px; background: var(--foam); border-left: 1px solid rgba(201,168,124,0.15); overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--latte) transparent; }
        .detail-hero { width: 100%; height: 210px; object-fit: cover; }
        .detail-body { padding: 28px; }
        .detail-name { font-family: 'Noto Serif TC', serif; font-size: 22px; font-weight: 700; color: var(--espresso); }
        .maps-btn { display: block; margin-top: 24px; padding: 14px; text-align: center; background: var(--espresso); color: var(--latte); border-radius: 14px; text-decoration: none; font-size: 14px; font-weight: 700; transition: all 0.3s; box-shadow: 0 4px 12px rgba(44,26,14,0.15); }
        .maps-btn:hover { opacity: 0.95; transform: scale(1.02); }
        @keyframes pulse-green { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .dot-open { animation: pulse-green 2s ease-in-out infinite; }
      `}</style>
 
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="brand-title">板橋咖啡廳地圖</div>
            <div className="brand-sub">Banqiao Café Explorer</div>
          </div>
 
          <div className="auth-section">
            <div className="user-info">
              <img src={user.user_metadata.avatar_url} alt="avatar" className="user-avatar" />
              <div className="nickname-box" style={{ display: 'flex', flexDirection: 'column' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid var(--latte)', borderRadius: '6px', width: '90px' }} value={nickname} onChange={e => setNickname(e.target.value)} />
                    <button className="auth-btn" style={{ background: 'var(--espresso)', color: 'var(--latte)' }} onClick={updateNickname}>存</button>
                  </div>
                ) : (
                  <>
                    <span className="user-name">{nickname}</span>
                    <span className="edit-link" onClick={() => setIsEditing(true)}>修改暱稱</span>
                  </>
                )}
              </div>
            </div>
            <button className="auth-btn logout-btn" onClick={handleLogout}>登出</button>
          </div>
 
          <div className="search-wrap">
            <input type="text" placeholder="探索巷弄中的咖啡香..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
 
          <div className="filter-section">
            <div className="filter-label">快速篩選</div>
            <div className="toggle-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button className={`toggle-btn ${filterDelivery ? 'active' : ''}`} onClick={() => setFilterDelivery(p => !p)}>🛵 外送</button>
              <button className={`toggle-btn ${filterPet ? 'active' : ''}`} onClick={() => setFilterPet(p => !p)}>🐾 寵物友善</button>
              <button className={`toggle-btn ${filterNoTimeLimit ? 'active' : ''}`} onClick={() => setFilterNoTimeLimit(p => !p)}>⏰ 不限時</button>
              <button className={`toggle-btn ${filterMRT ? 'active' : ''}`} onClick={() => setFilterMRT(p => !p)}>🚇 近捷運站</button>
              <button className={`toggle-btn ${filterOutlet ? 'active' : ''}`} onClick={() => setFilterOutlet(p => !p)}>🔌 有插座</button>
              <button className={`toggle-btn ${filterSpecialty ? 'active' : ''}`} onClick={() => setFilterSpecialty(p => !p)}>☕ 精品咖啡</button>
              <button className={`toggle-btn ${filterPourOver ? 'active' : ''}`} onClick={() => setFilterPourOver(p => !p)}>🫖 手沖咖啡</button>
            </div>
            <div className="filter-label" style={{ marginTop: 10 }}>消費金額</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['$1-200', '$200-400', '$400-600'].map(p => (
                <button key={p} className={`toggle-btn ${filterPrices.includes(p) ? 'active' : ''}`}
                  onClick={() => setFilterPrices(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}>
                  {p}
                </button>
              ))}
            </div>
          </div>
 
          <div className="cafe-count">找到 {filtered.length} 個特色空間</div>
          <div className="cafe-list">
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', opacity: 0.5 }}>咖啡豆研磨中...</div>
            ) : filtered.map(cafe => {
              const openStatus = isOpenNow(cafe.id);
              return (
                <div key={cafe.id} className={`cafe-card ${selectedCafe?.id === cafe.id ? 'selected' : ''}`} onClick={() => setSelectedCafe(cafe)}>
                  {cafe.image_url && <img src={cafe.image_url} className="cafe-card-img" />}
                  <div className="cafe-card-body">
                    <div className="cafe-card-name">{cafe.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StarRating rating={cafe.rating || 0} />
                      <span style={{ fontSize: '11px', color: '#B09B8A', letterSpacing: '0.02em' }}>
                        ({cafe.review_count || 0})
                      </span>
                      {openStatus !== null && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div
                            className={openStatus ? 'dot-open' : ''}
                            style={{
                              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                              background: openStatus ? '#22C55E' : '#EF4444',
                              boxShadow: openStatus
                                ? '0 0 0 2px rgba(34,197,94,0.2)'
                                : '0 0 0 2px rgba(239,68,68,0.2)',
                            }}
                          />
                          <span style={{ fontSize: 10, fontWeight: 600, color: openStatus ? '#16A34A' : '#DC2626' }}>
                            {openStatus ? '營業中' : '休息中'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {cafe.tags?.includes('近捷運站') && <span style={tagStyle}>近捷運站</span>}
                      {cafe.has_outlet && <span style={tagStyle}>有插座</span>}
                      {cafe.is_no_time_limit && <span style={tagStyle}>不限時</span>}
                      {cafe.is_pet_friendly && <span style={tagStyle}>寵物友善</span>}
                      {cafe.delivery && <span style={tagStyle}>外送</span>}
                      {cafe.tags?.includes('精品咖啡') && <span style={tagStyle}>精品咖啡</span>}
                      {cafe.tags?.includes('手沖咖啡') && <span style={tagStyle}>手沖咖啡</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
 
        <div className="map-area">
          <Map cafes={filtered} />
          <Link
            href="/fortune"
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              zIndex: 1000,
              background: 'var(--espresso)',
              color: 'var(--latte)',
              padding: '12px 20px',
              borderRadius: '50px',
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🔮 不知道去哪？試試咖啡運勢
          </Link>
        </div>
 
        <aside className="detail-panel">
          {selectedCafe ? (
            <>
              {selectedCafe.image_url && <img src={selectedCafe.image_url} className="detail-hero" />}
              <div className="detail-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div className="detail-name">{selectedCafe.name}</div>
                  {(() => {
                    const openStatus = isOpenNow(selectedCafe.id);
                    if (openStatus === null) return null;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginTop: 4, background: openStatus ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', padding: '4px 10px', borderRadius: 99, border: `1px solid ${openStatus ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                        <div
                          className={openStatus ? 'dot-open' : ''}
                          style={{ width: 7, height: 7, borderRadius: '50%', background: openStatus ? '#22C55E' : '#EF4444', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 11, fontWeight: 700, color: openStatus ? '#16A34A' : '#DC2626' }}>
                          {openStatus ? '營業中' : '休息中'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div style={{ height: '1.5px', background: 'rgba(201,168,124,0.2)', margin: '20px 0' }} />
                <p style={{ fontSize: 14, color: '#6D5D4E', lineHeight: 1.8, letterSpacing: '0.01em' }}>{selectedCafe.address}</p>
 
                {/* 營業時間區塊 */}
                <OpeningHoursBlock cafeId={selectedCafe.id} openingHours={openingHours} />
 
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                  {selectedCafe.tags?.includes('近捷運站') && (
                    <span style={filterMRT ? tagActiveStyle : tagClickStyle} onClick={() => setFilterMRT(p => !p)}>
                      {filterMRT ? '✓ ' : ''}近捷運站
                    </span>
                  )}
                  {selectedCafe.has_outlet && (
                    <span style={filterOutlet ? tagActiveStyle : tagClickStyle} onClick={() => setFilterOutlet(p => !p)}>
                      {filterOutlet ? '✓ ' : ''}有插座
                    </span>
                  )}
                  {selectedCafe.is_no_time_limit && (
                    <span style={filterNoTimeLimit ? tagActiveStyle : tagClickStyle} onClick={() => setFilterNoTimeLimit(p => !p)}>
                      {filterNoTimeLimit ? '✓ ' : ''}不限時
                    </span>
                  )}
                  {selectedCafe.is_pet_friendly && (
                    <span style={filterPet ? tagActiveStyle : tagClickStyle} onClick={() => setFilterPet(p => !p)}>
                      {filterPet ? '✓ ' : ''}寵物友善
                    </span>
                  )}
                  {selectedCafe.delivery && (
                    <span style={filterDelivery ? tagActiveStyle : tagClickStyle} onClick={() => setFilterDelivery(p => !p)}>
                      {filterDelivery ? '✓ ' : ''}外送
                    </span>
                  )}
                  {selectedCafe.tags?.includes('精品咖啡') && (
                    <span style={filterSpecialty ? tagActiveStyle : tagClickStyle} onClick={() => setFilterSpecialty(p => !p)}>
                      {filterSpecialty ? '✓ ' : ''}精品咖啡
                    </span>
                  )}
                  {selectedCafe.tags?.includes('手沖咖啡') && (
                    <span style={filterPourOver ? tagActiveStyle : tagClickStyle} onClick={() => setFilterPourOver(p => !p)}>
                      {filterPourOver ? '✓ ' : ''}手沖咖啡
                    </span>
                  )}
                </div>
                <a href={selectedCafe.google_maps_url || '#'} target="_blank" className="maps-btn">在 Google Maps 開啟導航 →</a>
                <ReviewList cafeId={selectedCafe.id} />
                <ReviewForm cafeId={selectedCafe.id} />
              </div>
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', color: '#C9A87C' }}>
              <div style={{ fontSize: '40px', marginBottom: '20px', opacity: 0.4 }}>☕</div>
              <p style={{ fontSize: 15, fontWeight: 600, opacity: 0.8 }}>選一個咖啡空間<br/>開啟您的品味之旅</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
 