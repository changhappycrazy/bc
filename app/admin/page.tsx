'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'

const ADMIN_EMAIL = 'satestbc@gmail.com'

type Report = {
  id: string
  cafe_id: number
  user_id: string
  ac_level: number
  quiet_level: number
  seat_status: string
  created_at: string
}

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [cafes, setCafes] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [filterCafe, setFilterCafe] = useState<number | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.replace('/')
        return
      }

      const [{ data: reportData }, { data: cafeData }] = await Promise.all([
        supabase.from('cafe_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('cafes').select('id, name')
      ])

      if (cafeData) {
        const map: Record<number, string> = {}
        cafeData.forEach((c: any) => { map[c.id] = c.name })
        setCafes(map)
      }
      if (reportData) setReports(reportData)
      setLoading(false)
    }
    init()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此回報？')) return
    const { error } = await supabase.from('cafe_reports').delete().eq('id', id)
    if (error) { alert('刪除失敗：' + error.message); return }
    setReports(prev => prev.filter(r => r.id !== id))
  }

  const seatConfig: Record<string, { color: string; label: string; bg: string }> = {
    green:  { color: '#16A34A', label: '位置充足', bg: 'rgba(34,197,94,0.1)'  },
    yellow: { color: '#D97706', label: '還有位置', bg: 'rgba(245,158,11,0.1)' },
    red:    { color: '#DC2626', label: '幾乎客滿', bg: 'rgba(239,68,68,0.1)'  },
  }

  const ScoreDots = ({ value }: { value: number }) => (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(n => (
        <div key={n} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: n <= value ? '#2C1A0E' : 'rgba(201,168,124,0.2)',
        }} />
      ))}
    </div>
  )

  const displayed = filterCafe
    ? reports.filter(r => r.cafe_id === filterCafe)
    : reports

  // 依咖啡廳分組統計
  const cafeStats = Object.entries(
    reports.reduce((acc, r) => {
      acc[r.cafe_id] = (acc[r.cafe_id] || 0) + 1
      return acc
    }, {} as Record<number, number>)
  ).sort((a, b) => b[1] - a[1])

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0E8' }}>
      <p style={{ fontFamily: 'Noto Serif TC', color: '#2C1A0E', fontSize: 16 }}>🛡️ 驗證管理員身份中...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'Lato, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,124,0.4); border-radius: 99px; }
      `}</style>

      {/* Header */}
      <div style={{ background: '#2C1A0E', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 20px rgba(44,26,14,0.3)' }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'rgba(201,168,124,0.15)', color: '#C9A87C', border: '1px solid rgba(201,168,124,0.3)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,124,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,124,0.15)'}
        >← 返回地圖</button>
        <div>
          <h1 style={{ fontFamily: 'Noto Serif TC', fontSize: 20, color: '#C9A87C', fontWeight: 700 }}>🛡️ 管理後台</h1>
          <p style={{ fontSize: 11, color: 'rgba(201,168,124,0.5)', marginTop: 2 }}>即時回報資料管理</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          {[
            { label: '總回報數', value: reports.length },
            { label: '涵蓋店家', value: Object.keys(cafes).filter(id => reports.some(r => r.cafe_id === Number(id))).length },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A87C' }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(201,168,124,0.5)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* 左側：咖啡廳篩選 */}
        <div style={{ width: 200, flexShrink: 0, background: 'white', borderRadius: 16, padding: '16px', border: '1px solid rgba(201,168,124,0.2)', boxShadow: '0 2px 10px rgba(44,26,14,0.06)', position: 'sticky', top: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#7A5C3A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>按店家篩選</p>
          <button
            onClick={() => setFilterCafe(null)}
            style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4, background: filterCafe === null ? '#2C1A0E' : 'transparent', color: filterCafe === null ? '#C9A87C' : '#4A3728', fontWeight: filterCafe === null ? 700 : 400, fontSize: 13, transition: 'all 0.2s' }}
          >
            全部 <span style={{ float: 'right', fontSize: 11, opacity: 0.7 }}>{reports.length}</span>
          </button>
          {cafeStats.map(([id, count]) => (
            <button
              key={id}
              onClick={() => setFilterCafe(Number(id))}
              style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4, background: filterCafe === Number(id) ? '#2C1A0E' : 'transparent', color: filterCafe === Number(id) ? '#C9A87C' : '#4A3728', fontWeight: filterCafe === Number(id) ? 700 : 400, fontSize: 12, transition: 'all 0.2s', lineHeight: 1.4 }}
            >
              {cafes[Number(id)] ?? `#${id}`}
              <span style={{ float: 'right', fontSize: 11, opacity: 0.6 }}>{count}</span>
            </button>
          ))}
        </div>

        {/* 右側：回報列表 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Noto Serif TC', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>
              {filterCafe ? `${cafes[filterCafe]} 的回報` : '所有即時回報'}
            </h2>
            <span style={{ background: '#2C1A0E', color: '#C9A87C', fontSize: 11, padding: '2px 10px', borderRadius: 99, fontWeight: 700 }}>
              {displayed.length} 筆
            </span>
          </div>

          {displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#B09B8A', background: 'white', borderRadius: 16, border: '1px solid rgba(201,168,124,0.15)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
              <p style={{ fontSize: 14 }}>目前沒有回報資料</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayed.map(r => {
                const seat = seatConfig[r.seat_status] ?? seatConfig.green
                const time = new Date(r.created_at)
                return (
                  <div key={r.id} style={{ background: 'white', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 8px rgba(44,26,14,0.06)', border: '1px solid rgba(201,168,124,0.18)', display: 'flex', alignItems: 'center', gap: 18 }}>

                    {/* 店名 */}
                    <div style={{ width: 130, flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', fontFamily: 'Noto Serif TC', lineHeight: 1.4 }}>
                        {cafes[r.cafe_id] ?? `#${r.cafe_id}`}
                      </div>
                      <div style={{ fontSize: 10, color: '#B09B8A', marginTop: 3 }}>
                        {time.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} {time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* 分隔線 */}
                    <div style={{ width: 1, height: 36, background: 'rgba(201,168,124,0.2)', flexShrink: 0 }} />

                    {/* 冷氣 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#B09B8A', marginBottom: 5 }}>❄️ 冷氣強度</div>
                      <ScoreDots value={r.ac_level} />
                      <div style={{ fontSize: 11, color: '#7A5C3A', marginTop: 3, fontWeight: 600 }}>{r.ac_level} / 5</div>
                    </div>

                    {/* 安靜 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#B09B8A', marginBottom: 5 }}>🤫 安靜程度</div>
                      <ScoreDots value={r.quiet_level} />
                      <div style={{ fontSize: 11, color: '#7A5C3A', marginTop: 3, fontWeight: 600 }}>{r.quiet_level} / 5</div>
                    </div>

                    {/* 空位 */}
                    <div style={{ flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: '#B09B8A', marginBottom: 6 }}>💺 空位狀況</div>
                      <div style={{ padding: '4px 10px', borderRadius: 99, background: seat.bg, color: seat.color, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: seat.color }} />
                        {seat.label}
                      </div>
                    </div>

                    {/* 刪除 */}
                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{ background: 'rgba(220,38,38,0.07)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0, transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.14)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.07)'}
                    >🗑️ 刪除</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}