'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'

const ADMIN_EMAIL = 'satestbc@gmail.com'

// ── Types ──────────────────────────────────────────────
type CafeReport = {
  id: string
  cafe_id: number
  user_id: string
  ac_level: number
  quiet_level: number
  seat_status: string
  created_at: string
}

type ReviewReport = {
  id: string
  review_id: string
  reporter_id: string
  reason: string
  created_at: string
  // joined
  review_content?: string
  review_user_name?: string
  review_cafe_id?: number
}

// ── Main ───────────────────────────────────────────────
export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()

  const [tab, setTab] = useState<'reports' | 'review-reports'>('reports')

  // 即時回報
  const [cafeReports, setCafeReports] = useState<CafeReport[]>([])
  const [cafes, setCafes] = useState<Record<number, string>>({})
  const [filterCafe, setFilterCafe] = useState<number | null>(null)

  // 檢舉留言
  const [reviewReports, setReviewReports] = useState<ReviewReport[]>([])
  const [filterHandled, setFilterHandled] = useState<'all' | 'pending'>('pending')

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) { router.replace('/'); return }

      const [{ data: reportData }, { data: cafeData }, { data: rrData }] = await Promise.all([
        supabase.from('cafe_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('cafes').select('id, name'),
        supabase.from('review_reports').select('*').order('created_at', { ascending: false }),
      ])

      if (cafeData) {
        const map: Record<number, string> = {}
        cafeData.forEach((c: any) => { map[c.id] = c.name })
        setCafes(map)
      }
      if (reportData) setCafeReports(reportData)

      // 把 review_reports join review 資料
      if (rrData && rrData.length > 0) {
        const reviewIds = [...new Set(rrData.map((r: any) => r.review_id))]
        const { data: reviewsData } = await supabase
          .from('cafe_reviews')
          .select('id, content, user_name, cafe_id')
          .in('id', reviewIds)

        const reviewMap: Record<number, any> = {}
        reviewsData?.forEach((r: any) => { reviewMap[r.id] = r })

        const enriched: ReviewReport[] = rrData.map((r: any) => ({
          ...r,
          review_content: reviewMap[r.review_id]?.content ?? '（留言已刪除）',
          review_user_name: reviewMap[r.review_id]?.user_name ?? '—',
          review_cafe_id: reviewMap[r.review_id]?.cafe_id ?? null,
        }))
        setReviewReports(enriched)
      }

      setLoading(false)
    }
    init()
  }, [])

  // ── 刪除即時回報 ────────────────────────────────────
  const handleDeleteCafeReport = async (id: string) => {
    if (!confirm('確定刪除此回報？')) return
    const { error } = await supabase.from('cafe_reports').delete().eq('id', id)
    if (error) { alert('刪除失敗：' + error.message); return }
    setCafeReports(prev => prev.filter(r => r.id !== id))
  }

  // ── 刪除被檢舉的留言（同時移除該檢舉記錄） ──────────
  const handleDeleteReportedReview = async (rr: ReviewReport) => {
    if (!confirm(`確定刪除「${rr.review_user_name}」的留言並結案？`)) return

    // 刪除原始留言（cascade 會自動移除 review_reports）
    const { error } = await supabase.from('cafe_reviews').delete().eq('id', rr.review_id)
    if (error) { alert('刪除失敗：' + error.message); return }
    setReviewReports(prev => prev.filter(r => r.review_id !== rr.review_id))
  }

  // ── 忽略（只刪檢舉記錄，保留留言） ──────────────────
  const handleDismissReport = async (id: string) => {
    if (!confirm('確定忽略此檢舉？（留言將保留）')) return
    const { error } = await supabase.from('review_reports').delete().eq('id', id)
    if (error) { alert('操作失敗：' + error.message); return }
    setReviewReports(prev => prev.filter(r => r.id !== id))
  }

  // ── Helpers ──────────────────────────────────────────
  const seatConfig: Record<string, { color: string; label: string; bg: string }> = {
    green:  { color: '#16A34A', label: '位置充足', bg: 'rgba(34,197,94,0.1)'  },
    yellow: { color: '#D97706', label: '還有位置', bg: 'rgba(245,158,11,0.1)' },
    red:    { color: '#DC2626', label: '幾乎客滿', bg: 'rgba(239,68,68,0.1)'  },
  }

  const ScoreDots = ({ value }: { value: number }) => (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(n => (
        <div key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: n <= value ? '#2C1A0E' : 'rgba(201,168,124,0.2)' }} />
      ))}
    </div>
  )

  const displayedCafeReports = filterCafe ? cafeReports.filter(r => r.cafe_id === filterCafe) : cafeReports
  const cafeStats = Object.entries(
    cafeReports.reduce((acc, r) => { acc[r.cafe_id] = (acc[r.cafe_id] || 0) + 1; return acc }, {} as Record<number, number>)
  ).sort((a, b) => b[1] - a[1])

  // 依 review_id 分組，同一則留言可能被多人檢舉
  const groupedReviewReports = reviewReports.reduce((acc, rr) => {
    const key = rr.review_id
    if (!acc[key]) acc[key] = []
    acc[key].push(rr)
    return acc
  }, {} as Record<string, ReviewReport[]>)

  const pendingCount = Object.keys(groupedReviewReports).length

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
            { label: '總回報數', value: cafeReports.length },
            { label: '待審檢舉', value: pendingCount },
            { label: '涵蓋店家', value: Object.keys(cafes).filter(id => cafeReports.some(r => r.cafe_id === Number(id))).length },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: stat.label === '待審檢舉' && stat.value > 0 ? '#FCA5A5' : '#C9A87C' }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(201,168,124,0.5)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ background: 'white', borderBottom: '1px solid rgba(201,168,124,0.2)', padding: '0 32px', display: 'flex', gap: 0 }}>
        {(([
          { key: 'reports', label: '📡 即時回報', count: cafeReports.length, alert: false },
          { key: 'review-reports', label: '⚑ 檢舉留言', count: pendingCount, alert: pendingCount > 0 },
        ] as { key: 'reports' | 'review-reports'; label: string; count: number; alert: boolean }[])).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? '#2C1A0E' : '#7A5C3A',
              borderBottom: tab === t.key ? '2.5px solid #2C1A0E' : '2.5px solid transparent',
              fontSize: 13, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {t.label}
            <span style={{
              fontSize: 10, padding: '1px 7px', borderRadius: 99, fontWeight: 700,
              background: t.alert ? '#DC2626' : (tab === t.key ? '#2C1A0E' : 'rgba(201,168,124,0.2)'),
              color: t.alert ? 'white' : (tab === t.key ? '#C9A87C' : '#7A5C3A'),
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ════════════ TAB: 即時回報 ════════════ */}
        {tab === 'reports' && (
          <>
            {/* 左側篩選 */}
            <div style={{ width: 200, flexShrink: 0, background: 'white', borderRadius: 16, padding: 16, border: '1px solid rgba(201,168,124,0.2)', boxShadow: '0 2px 10px rgba(44,26,14,0.06)', position: 'sticky', top: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#7A5C3A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>按店家篩選</p>
              <button
                onClick={() => setFilterCafe(null)}
                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4, background: filterCafe === null ? '#2C1A0E' : 'transparent', color: filterCafe === null ? '#C9A87C' : '#4A3728', fontWeight: filterCafe === null ? 700 : 400, fontSize: 13, transition: 'all 0.2s' }}
              >
                全部 <span style={{ float: 'right', fontSize: 11, opacity: 0.7 }}>{cafeReports.length}</span>
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

            {/* 右側列表 */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'Noto Serif TC', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>
                  {filterCafe ? `${cafes[filterCafe]} 的回報` : '所有即時回報'}
                </h2>
                <span style={{ background: '#2C1A0E', color: '#C9A87C', fontSize: 11, padding: '2px 10px', borderRadius: 99, fontWeight: 700 }}>
                  {displayedCafeReports.length} 筆
                </span>
              </div>

              {displayedCafeReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#B09B8A', background: 'white', borderRadius: 16, border: '1px solid rgba(201,168,124,0.15)' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
                  <p style={{ fontSize: 14 }}>目前沒有回報資料</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {displayedCafeReports.map(r => {
                    const seat = seatConfig[r.seat_status] ?? seatConfig.green
                    const time = new Date(r.created_at)
                    return (
                      <div key={r.id} style={{ background: 'white', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 8px rgba(44,26,14,0.06)', border: '1px solid rgba(201,168,124,0.18)', display: 'flex', alignItems: 'center', gap: 18 }}>
                        <div style={{ width: 130, flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', fontFamily: 'Noto Serif TC', lineHeight: 1.4 }}>{cafes[r.cafe_id] ?? `#${r.cafe_id}`}</div>
                          <div style={{ fontSize: 10, color: '#B09B8A', marginTop: 3 }}>
                            {time.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} {time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div style={{ width: 1, height: 36, background: 'rgba(201,168,124,0.2)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: '#B09B8A', marginBottom: 5 }}>❄️ 冷氣強度</div>
                          <ScoreDots value={r.ac_level} />
                          <div style={{ fontSize: 11, color: '#7A5C3A', marginTop: 3, fontWeight: 600 }}>{r.ac_level} / 5</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: '#B09B8A', marginBottom: 5 }}>🤫 安靜程度</div>
                          <ScoreDots value={r.quiet_level} />
                          <div style={{ fontSize: 11, color: '#7A5C3A', marginTop: 3, fontWeight: 600 }}>{r.quiet_level} / 5</div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <div style={{ fontSize: 10, color: '#B09B8A', marginBottom: 6 }}>💺 空位狀況</div>
                          <div style={{ padding: '4px 10px', borderRadius: 99, background: seat.bg, color: seat.color, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: seat.color }} />
                            {seat.label}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCafeReport(r.id)}
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
          </>
        )}

        {/* ════════════ TAB: 檢舉留言 ════════════ */}
        {tab === 'review-reports' && (
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Noto Serif TC', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>
                ⚑ 用戶檢舉留言
              </h2>
              {pendingCount > 0 && (
                <span style={{ background: '#DC2626', color: 'white', fontSize: 11, padding: '2px 10px', borderRadius: 99, fontWeight: 700 }}>
                  {pendingCount} 則待審
                </span>
              )}
            </div>

            {Object.keys(groupedReviewReports).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#B09B8A', background: 'white', borderRadius: 16, border: '1px solid rgba(201,168,124,0.15)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                <p style={{ fontSize: 14 }}>目前沒有待審的檢舉</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(groupedReviewReports).map(([reviewId, rrs]) => {
                  const first = rrs[0]
                  const cafeName = first.review_cafe_id ? (cafes[first.review_cafe_id] ?? `店家 #${first.review_cafe_id}`) : '—'
                  return (
                    <div key={reviewId} style={{ background: 'white', borderRadius: 16, border: '1.5px solid rgba(220,38,38,0.2)', boxShadow: '0 2px 12px rgba(44,26,14,0.07)', overflow: 'hidden' }}>
                      {/* 頂部：留言資訊 */}
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(201,168,124,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #2C1A0E, #7A5C3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A87C', fontSize: 10, fontWeight: 700 }}>
                                {first.review_user_name?.charAt(0) || '?'}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#4A3728' }}>{first.review_user_name}</span>
                              <span style={{ fontSize: 10, color: '#B09B8A' }}>在</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#7A5C3A', background: 'rgba(201,168,124,0.12)', padding: '2px 8px', borderRadius: 99 }}>{cafeName}</span>
                            </div>
                            {/* 留言內容 */}
                            <div style={{ background: '#FFF8F0', border: '1px solid rgba(201,168,124,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2C1A0E', lineHeight: 1.7 }}>
                              {first.review_content ?? '（留言已刪除）'}
                            </div>
                          </div>

                          {/* 操作按鈕 */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                            <button
                              onClick={() => handleDeleteReportedReview(first)}
                              style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.16)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.08)'}
                            >🗑️ 刪除留言</button>
                            {rrs.map(rr => (
                              <button
                                key={rr.id}
                                onClick={() => handleDismissReport(rr.id)}
                                style={{ background: 'rgba(107,114,128,0.07)', color: '#6B7280', border: '1px solid rgba(107,114,128,0.2)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,114,128,0.14)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(107,114,128,0.07)'}
                              >✓ 忽略此檢舉</button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 底部：檢舉清單 */}
                      <div style={{ padding: '10px 18px', background: 'rgba(254,242,242,0.5)' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#B91C1C', letterSpacing: '0.08em', marginBottom: 8 }}>
                          ⚑ 共 {rrs.length} 人檢舉
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {rrs.map(rr => (
                            <div key={rr.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, padding: '4px 10px' }}>
                              <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>{rr.reason}</span>
                              <span style={{ fontSize: 10, color: '#B09B8A' }}>
                                {new Date(rr.created_at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}