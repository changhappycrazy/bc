'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import CafeDetailModal from '../components/CafeDetailModal';
import { questionBank, Question } from './questions'; // 👈 引入剛才搬出去的題庫

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

  // 🧩 人格測試狀態機：'gate' (主入口卡片) | 'testing' (答題中) | 'result' (看結果)
  const [quizView, setQuizView] = useState<'gate' | 'testing' | 'result'>('gate');
  const [currentQuiz, setCurrentQuiz] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ S: 0, V: 0, C: 0, F: 0, R: 0, M: 0, H: 0, P: 0 });
  const [personalityTitle, setPersonalityTitle] = useState('');
  const [recommendedCafes, setRecommendedCafes] = useState<any[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  useEffect(() => {
    setFortune(fortunes[Math.floor(Math.random() * fortunes.length)]);
    fetchCafes();
  }, []);

  async function fetchCafes() {
    const { data } = await supabase.from('cafes').select('*');
    setCafes(data || []);
  }

  const handleResult = (cafe: any) => {
    setSelectedFortuneCafe(cafe);
    setShowModal(true);
  };

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

  // 開始個性測試邏輯（隨機抽取10題）
  const startQuiz = () => {
    const shuffled = [...questionBank].sort(() => 0.5 - Math.random()).slice(0, 10);
    setCurrentQuiz(shuffled);
    setCurrentIndex(0);
    setScores({ S: 0, V: 0, C: 0, F: 0, R: 0, M: 0, H: 0, P: 0 });
    setQuizView('testing');
  };

  // 點擊答案累算邏輯
  const handleQuizAnswer = async (dimension: string) => {
    const updatedScores = { ...scores, [dimension]: scores[dimension] + 1 };
    setScores(updatedScores);

    if (currentIndex + 1 >= 10) {
      setIsQuizLoading(true);
      await calculateQuizResult(updatedScores);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // 前後端權重比對與模糊推薦邏輯
  const calculateQuizResult = async (finalScores: Record<string, number>) => {
    const queryTags = {
      is_quiet: finalScores.S >= finalScores.V,
      is_coffee_first: finalScores.C >= finalScores.F,
      is_retro: finalScores.R >= finalScores.M,
      is_hidden: finalScores.H >= finalScores.P
    };

    // 設定性格標題頭銜
    const label1 = queryTags.is_quiet ? "孤獨安靜" : "熱鬧熱情";
    const label2 = queryTags.is_coffee_first ? "咖啡職人" : "甜點控";
    const label3 = queryTags.is_retro ? "復古老宅" : "極簡現代";
    const label4 = queryTags.is_hidden ? "巷弄秘境風" : "開闊社交風";
    setPersonalityTitle(`${label1} × ${label2} 的 ${label3}${label4}`);

    try {
      const { data: allCafes, error } = await supabase.from('cafes').select('*');
      if (error) throw error;

      if (allCafes && allCafes.length > 0) {
        const scoredCafes = allCafes.map((cafe: any) => {
          let matchScore = 0;
          // 🛠️ 修正：將 queryTags.is_silent 修正為對應的 queryTags.is_quiet，讓權重配對完全精準
          if (cafe.is_quiet === queryTags.is_quiet) matchScore++;
          if (cafe.is_coffee_first === queryTags.is_coffee_first) matchScore++;
          if (cafe.is_retro === queryTags.is_retro) matchScore++;
          if (cafe.is_hidden === queryTags.is_hidden) matchScore++;
          return { ...cafe, matchScore };
        });

        // 照匹配分數高低排序
        scoredCafes.sort((a, b) => b.matchScore - a.matchScore);
        setRecommendedCafes(scoredCafes.slice(0, 3)); // 推薦前三高相似度的店
      }
      setIsQuizLoading(false);
      setQuizView('result');
    } catch (err) {
      console.error("比對失敗：", err);
      setIsQuizLoading(false);
      setQuizView('gate');
    }
  };

  return (
    <div className="fortune-container">
      <style>{`
        .fortune-container { min-height: 100vh; background: #F5F0E8; padding: 40px 20px; font-family: 'Noto Serif TC', serif; display: flex; flex-direction: column; align-items: center; }
        .back-btn { align-self: flex-start; background: none; border: 1px solid #7A5C3A; color: #7A5C3A; padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-bottom: 20px; }
        .fortune-card { background: white; padding: 30px; border-radius: 24px; box-shadow: 0 10px 30px rgba(44,26,14,0.05); text-align: center; max-width: 500px; width: 100%; margin-bottom: 40px; border: 2px solid #C9A87C; }
        .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; width: 100%; max-width: 1000px; }
        .box { background: white; padding: 40px; border-radius: 24px; display: flex; flex-direction: column; align-items: center; min-height: 400px; box-sizing: border-box; }
        
        .wheel-container { position: relative; width: 250px; height: 250px; border-radius: 50%; border: 8px solid #2C1A0E; overflow: hidden; transition: transform 3s cubic-bezier(0.15, 0, 0.15, 1); }
        .wheel-pointer { z-index: 10; font-size: 30px; }
        
        .quiz-box-full { background: white; padding: 40px; border-radius: 24px; width: 100%; max-width: 600px; text-align: center; box-shadow: 0 10px 30px rgba(44,26,14,0.05); }
        .quiz-option-btn { background: #fdfbf7; color: #333; border: 1px solid #dcd1c4; text-align: left; font-size: 16px; padding: 16px; width: 100%; border-radius: 12px; cursor: pointer; margin-bottom: 12px; transition: all 0.2s; }
        .quiz-option-btn:hover { background: #f5eee6; border-color: #7A5C3A; }
        .progress-bar-container { margin-top: 30px; width: 100%; text-align: left; color: #888; font-size: 13px; }
        .cafe-recommend-card { border: 1px solid #e6dfd5; padding: 18px; border-radius: 12px; margin-bottom: 15px; text-align: left; cursor: pointer; transition: background 0.2s; }
        .cafe-recommend-card:hover { background: #faf8f5; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 5px; display: inline-block; }

        .action-btn { margin-top: 30px; background: #2C1A0E; color: #C9A87C; padding: 12px 30px; border-radius: 50px; border: none; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
        .action-btn:hover { opacity: 0.9; }
      `}</style>

      <button className="back-btn" onClick={() => router.back()}>← 返回地圖</button>

      {/* 🌟 TODAY'S FORTUNE */}
      <div className="fortune-card">
        <h2 style={{ color: '#7A5C3A', fontSize: '14px', letterSpacing: '2px', marginBottom: '10px' }}>TODAY'S FORTUNE</h2>
        <h1 style={{ fontSize: '24px', color: '#2C1A0E' }}>{fortune}</h1>
      </div>

      {/* 🟢 第一階段：主入口 */}
      {quizView === 'gate' && (
        <div className="section-grid">
          {/* 左側：咖啡轉盤 */}
          <div className="box">
            <h3 style={{ marginBottom: '20px', color: '#2C1A0E' }}>☕ 命運咖啡轉盤</h3>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="wheel-pointer" style={{ position: 'absolute', top: -20, zIndex: 10 }}>▼</div>
              <div className="wheel-container" style={{ transform: `rotate(${rotation}deg)`, background: 'conic-gradient(#C9A87C 0% 25%, #F5F0E8 25% 50%, #C9A87C 50% 75%, #F5F0E8 75% 100%)' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold', color: '#2C1A0E' }}>GO!</div>
              </div>
              <button className="action-btn" onClick={startSpin} disabled={isSpinning}>
                {isSpinning ? '沖煮中...' : '開始轉動'}
              </button>
            </div>
          </div>

          {/* 右側：咖啡人個性測試入口卡片 */}
          <div className="box" style={{ justifyContent: 'center' }}>
            <h3 style={{ marginBottom: '10px', color: '#2C1A0E', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              🔍 咖啡廳個性測驗
            </h3>
            <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', lineHeight: '1.6', maxWidth: '280px' }}>
              快來測測看你的咖啡廳專屬人格，<br />
              幫你找到適合你的咖啡廳✨
            </p>
            <button className="action-btn" onClick={startQuiz}>
              開始測試
            </button>
          </div>
        </div>
      )}

      {/* 🟡 第二階段：答題中頁面 */}
      {quizView === 'testing' && currentQuiz.length > 0 && (
        <div className="quiz-box-full">
          {isQuizLoading ? (
            <div style={{ padding: '40px 0' }}>
              <h2 style={{ color: '#7A5C3A' }}>🔮 正在分析你的咖啡人格...</h2>
              <p style={{ color: '#888', marginTop: '10px' }}>正在從資料庫精選最適合你的口袋店家...</p>
            </div>
          ) : (
            <div>
              <h2 style={{ color: '#2C1A0E', fontSize: '20px', marginBottom: '25px', textAlign: 'left', lineHeight: '1.5' }}>
                {currentIndex + 1}. {currentQuiz[currentIndex].question}
              </h2>
              <div>
                {currentQuiz[currentIndex].options.map((opt, idx) => (
                  <button key={idx} className="quiz-option-btn" onClick={() => handleQuizAnswer(opt.dimension)}>
                    {opt.text}
                  </button>
                ))}
              </div>
              <div className="progress-bar-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>答題進度：{currentIndex} / 10 題</span>
                  <span>剩餘：{10 - currentIndex} 題</span>
                </div>
                <progress style={{ width: '100%', height: '8px' }} value={currentIndex} max={10} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔵 第三階段：測試結果頁面 */}
      {quizView === 'result' && (
        <div className="quiz-box-full" style={{ maxWidth: '550px' }}>
          <div style={{ backgroundColor: '#FDF7F2', padding: '20px', borderRadius: '16px', marginBottom: '25px', border: '1px solid #EADBC8' }}>
            <span style={{ fontSize: '13px', color: '#7A5C3A', fontWeight: 'bold', letterSpacing: '1px' }}>✨ 你的專屬咖啡廳人格是 ✨</span>
            <h2 style={{ margin: '8px 0 0 0', color: '#2C1A0E', fontSize: '24px' }}>{personalityTitle}</h2>
          </div>

          <h3 style={{ color: '#7A5C3A', fontSize: '16px', textAlign: 'left', marginBottom: '15px' }}>
            🪐 依照你的偏好，最推薦這幾間店：
          </h3>

          <div>
            {recommendedCafes.length > 0 ? (
              recommendedCafes.map((cafe) => (
                <div key={cafe.id} className="cafe-recommend-card" onClick={() => handleResult(cafe)}>
                  <span style={{ float: 'right', fontSize: '12px', color: '#888', backgroundColor: '#F0E6DB', padding: '2px 8px', borderRadius: '12px' }}>
                    契合度 {cafe.matchScore * 25}%
                  </span>
                  <h4 style={{ margin: '0 0 6px 0', color: '#2C1A0E', fontSize: '18px' }}>{cafe.name}</h4>
                  <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '13px' }}>📍 {cafe.address || '未提供完整地址'}</p>
                  
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {/* 🛠️ 修正與補齊：全面支援二選一雙向標籤渲染，確保所有特徵都有小標呈現 */}
                    {cafe.is_quiet ? (
                      <span className="badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>🤫 安靜</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: '#E1F5FE', color: '#0288D1' }}>🎉 熱鬧</span>
                    )}

                    {cafe.is_coffee_first ? (
                      <span className="badge" style={{ backgroundColor: '#EFEBE9', color: '#4E342E' }}>☕ 咖啡控</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: '#FCE4EC', color: '#C2185B' }}>🍰 甜點控</span>
                    )}

                    {cafe.is_retro ? (
                      <span className="badge" style={{ backgroundColor: '#FFF3E0', color: '#E65100' }}>🪵 老宅</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: '#E0F2F1', color: '#004D40' }}>🏢 現代</span>
                    )}

                    {cafe.is_hidden ? (
                      <span className="badge" style={{ backgroundColor: '#ECEFF1', color: '#37474F' }}>🧭 巷弄</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: '#F3E5F5', color: '#7B1FA2' }}>🪟 開闊</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#888', padding: '20px 0' }}>目前資料庫還沒有相近標籤的咖啡廳 😭</p>
            )}
          </div>

          <button className="action-btn" onClick={() => setQuizView('gate')} style={{ width: '100%', marginTop: '15px' }}>
            返回主畫面
          </button>
        </div>
      )}

      {/* 燈箱元件 */}
      {showModal && (
        <CafeDetailModal 
          cafe={selectedFortuneCafe} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}