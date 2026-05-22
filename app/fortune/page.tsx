'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import CafeDetailModal from '../components/CafeDetailModal';

const supabase = createClient();

const fortunes = [
  '今天適合找一間不限時咖啡廳逃避現實 ☕',
  '今日幸運地點：靠窗第二個座位 ✨',
  '今天會遇到神級巴斯克乳酪蛋糕 🍰',
  '適合點冰美式假裝自己很成熟 😌',
  '今天的靈感藏在咖啡香裡 📚',
  '小心今天會在咖啡廳待到天黑 🌙',
  '今天適合帶筆電出去裝忙 💻',
  '您的幸運咖啡豆：衣索比亞 ☕',
  '今天可能會發現寶藏小店 🗺️',
  '適合一個人安靜跑咖的日子 🌧️'
];

export default function FortunePage() {
  const router = useRouter();
  const [cafes, setCafes] = useState<any[]>([]);
  const [fortune, setFortune] = useState('');
  
  // 燈箱控制狀態
  const [showModal, setShowModal] = useState(false);
  const [selectedFortuneCafe, setSelectedFortuneCafe] = useState<any>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [pulledCard, setPulledCard] = useState<any>(null);

  useEffect(() => {
    setFortune(fortunes[Math.floor(Math.random() * fortunes.length)]);
    fetchCafes();
  }, []);

  async function fetchCafes() {
    const { data } = await supabase.from('cafes').select('*');
    setCafes(data || []);
  }

  // 統一處理結果：顯示燈箱
  const handleResult = (cafe: any) => {
    setSelectedFortuneCafe(cafe);
    setShowModal(true);
  };

  // 關閉燈箱：同時清空資料，確保下次能正常開啟
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFortuneCafe(null);
  };

  // 轉盤邏輯
  const startSpin = () => {
    if (isSpinning || cafes.length === 0) return;
    setIsSpinning(true);
    const newRotation = rotation + 1800 + Math.random() * 360; 
    setRotation(newRotation);
    setTimeout(() => {
      setIsSpinning(false);
      const winner = cafes[Math.floor(Math.random() * cafes.length)];
      handleResult(winner); 
    }, 3000);
  };

  // 抽卡邏輯
  const pullCard = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setPulledCard(null);
    
    setTimeout(() => {
      const luckyOne = cafes[Math.floor(Math.random() * cafes.length)];
      setPulledCard(luckyOne);
      setIsFlipping(false);
      
      // 抽完卡動畫結束後，延遲一點點時間彈出燈箱，視覺效果更好
      setTimeout(() => {
        handleResult(luckyOne);
      }, 500);
    }, 800);
  };

  return (
    <div className="fortune-container">
      <style>{`
        .fortune-container { min-height: 100vh; background: #F5F0E8; padding: 40px 20px; font-family: 'Noto Serif TC', serif; display: flex; flex-direction: column; align-items: center; }
        .back-btn { align-self: flex-start; background: none; border: 1px solid #7A5C3A; color: #7A5C3A; padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-bottom: 20px; }
        .fortune-card { background: white; padding: 30px; border-radius: 24px; box-shadow: 0 10px 30px rgba(44,26,14,0.05); text-align: center; max-width: 500px; width: 100%; margin-bottom: 40px; border: 2px solid #C9A87C; }
        .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; width: 100%; max-width: 1000px; }
        .box { background: white; padding: 40px; border-radius: 24px; display: flex; flex-direction: column; align-items: center; min-height: 400px; }
        
        .wheel-container { position: relative; width: 250px; height: 250px; border-radius: 50%; border: 8px solid #2C1A0E; overflow: hidden; transition: transform 3s cubic-bezier(0.15, 0, 0.15, 1); }
        .wheel-pointer {z-index: 10; font-size: 30px; }

        .card-slot { width: 200px; height: 280px; background: #EEE; border-radius: 16px; position: relative; perspective: 1000px; }
        .coffee-card { width: 100%; height: 100%; background: #2C1A0E; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #C9A87C; transition: transform 0.6s; transform-style: preserve-3d; cursor: pointer; }
        .card-inner { padding: 20px; text-align: center; }
        .flip-anim { transform: rotateY(180deg); }
        
        .action-btn { margin-top: 30px; background: #2C1A0E; color: #C9A87C; padding: 12px 30px; border-radius: 50px; border: none; font-weight: 700; cursor: pointer; }
      `}</style>

      <button className="back-btn" onClick={() => router.back()}>← 返回地圖</button>

      <div className="fortune-card">
        <h2 style={{ color: '#7A5C3A', fontSize: '14px', letterSpacing: '2px', marginBottom: '10px' }}>TODAY'S FORTUNE</h2>
        <h1 style={{ fontSize: '24px', color: '#2C1A0E' }}>{fortune}</h1>
      </div>

      <div className="section-grid">
        <div className="box">
          <h3 style={{ marginBottom: '20px' }}>☕ 命運咖啡轉盤</h3>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="wheel-pointer" style={{ position: 'absolute', top: -20, zIndex: 10 }}>▼</div>
          <div className="wheel-container" style={{ transform: `rotate(${rotation}deg)`, background: 'conic-gradient(#C9A87C 0% 25%, #F5F0E8 25% 50%, #C9A87C 50% 75%, #F5F0E8 75% 100%)' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold' }}>GO!</div>
          </div>
          <button className="action-btn" onClick={startSpin} disabled={isSpinning}>
            {isSpinning ? '沖煮中...' : '開始轉動'}
          </button>
        </div>
        </div>

        <div className="box">
          <h3 style={{ marginBottom: '20px' }}>🃏 咖啡探險抽卡</h3>
          <div className={`card-slot ${isFlipping ? 'flip-anim' : ''}`} onClick={() => pulledCard && handleResult(pulledCard)}>
            {pulledCard ? (
              <div className="coffee-card" style={{ background: 'white', border: '2px solid #2C1A0E', color: '#2C1A0E' }}>
                <div className="card-inner">
                  <p style={{ fontSize: '12px', color: '#7A5C3A' }}>本日推薦</p>
                  <h4 style={{ margin: '10px 0' }}>{pulledCard.name}</h4>
                  <p style={{ fontSize: '11px' }}>{pulledCard.address?.substring(0, 15)}...</p>
                </div>
              </div>
            ) : (
              <div className="coffee-card">
                <span style={{ fontSize: '40px' }}>☕</span>
              </div>
            )}
          </div>
          <button className="action-btn" onClick={pullCard} disabled={isFlipping}>
            {pulledCard ? '再抽一張' : '抽取今日緣分'}
          </button>
        </div>
      </div>

      {/* 修正後的燈箱元件呼叫方式 */}
      {showModal && (
        <CafeDetailModal 
          cafe={selectedFortuneCafe} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}