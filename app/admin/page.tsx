'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'

const ADMIN_EMAIL = 'satestbc@gmail.com'
const DAY_NAMES = ['日','一','二','三','四','五','六']

type CafeReport = {
  id: string; cafe_id: number; user_id: string
  ac_level: number; quiet_level: number; seat_status: string; created_at: string
}
type ReviewReport = {
  id: string; review_id: string; reporter_id: string; reason: string; created_at: string
  review_content?: string; review_user_name?: string; review_cafe_id?: number
}
type Cafe = {
  id: number; name: string; address: string
  google_map_url?: string; website?: string
  min_spend?: number
  has_outlet?: boolean; wifi_available?: boolean
  pet_friendly?: boolean; delivery?: boolean
  no_time_limit?: boolean; near_mrt?: boolean
  specialty_coffee?: boolean; pour_over?: boolean
}
type OpeningHour = {
  id?: number; cafe_id?: number; day_of_week: number
  open_time: string; close_time: string; is_closed: boolean
}

const DEFAULT_HOURS = (): OpeningHour[] =>
  [0,1,2,3,4,5,6].map(d => ({ day_of_week: d, open_time: '09:00', close_time: '21:00', is_closed: false }))

const EMPTY_CAFE: Omit<Cafe, 'id'> = {
  name: '', address: '', google_map_url: '', website: '',
  min_spend: undefined,
  has_outlet: false, wifi_available: false,
  pet_friendly: false, delivery: false,
  no_time_limit: false, near_mrt: false,
  specialty_coffee: false, pour_over: false,
}

const TAGS: { key: keyof Omit<Cafe,'id'>; emoji: string; label: string }[] = [
  { key: 'has_outlet',        emoji: '🔌', label: '有插座'   },
  { key: 'wifi_available',    emoji: '📶', label: 'Wi-Fi'    },
  { key: 'no_time_limit',     emoji: '⏱️', label: '不限時'   },
  { key: 'near_mrt',          emoji: '🚇', label: '近捷運站' },
  { key: 'pet_friendly',      emoji: '🐾', label: '寵物友善' },
  { key: 'delivery',          emoji: '🛵', label: '外送'     },
  { key: 'specialty_coffee',  emoji: '☕', label: '精品咖啡' },
  { key: 'pour_over',         emoji: '🫗', label: '手沖咖啡' },
]

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()

  const [tab, setTab] = useState<'reports' | 'review-reports' | 'cafes'>('reports')
  const [cafeReports, setCafeReports] = useState<CafeReport[]>([])
  const [cafes, setCafes] = useState<Record<number, string>>({})
  const [filterCafe, setFilterCafe] = useState<number | null>(null)
  const [reviewReports, setReviewReports] = useState<ReviewReport[]>([])
  const [cafeList, setCafeList] = useState<Cafe[]>([])
  const [cafeSearch, setCafeSearch] = useState('')
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null)
  const [editingHours, setEditingHours] = useState<OpeningHour[]>(DEFAULT_HOURS())
  const [showNewCafeForm, setShowNewCafeForm] = useState(false)
  const [newCafeData, setNewCafeData] = useState<Omit<Cafe,'id'>>(EMPTY_CAFE)
  const [newCafeHours, setNewCafeHours] = useState<OpeningHour[]>(DEFAULT_HOURS())
  const [cafeOpHours, setCafeOpHours] = useState<Record<number, OpeningHour[]>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) { router.replace('/'); return }

      const [{ data: reportData }, { data: cafeData }, { data: rrData }, { data: allCafes }, { data: ohData }] = await Promise.all([
        supabase.from('cafe_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('cafes').select('id, name'),
        supabase.from('review_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('cafes').select('*').order('id'),
        supabase.from('opening_hours').select('*'),
      ])

      if (cafeData) {
        const map: Record<number, string> = {}
        cafeData.forEach((c: any) => { map[c.id] = c.name })
        setCafes(map)
      }
      if (reportData) setCafeReports(reportData)
      if (allCafes) setCafeList(allCafes)
      if (ohData) {
        const map: Record<number, OpeningHour[]> = {}
        ohData.forEach((h: any) => {
          if (!map[h.cafe_id]) map[h.cafe_id] = []
          map[h.cafe_id].push(h)
        })
        setCafeOpHours(map)
      }

      if (rrData && rrData.length > 0) {
        const reviewIds = [...new Set(rrData.map((r: any) => r.review_id))]
        const { data: reviewsData } = await supabase
          .from('cafe_reviews').select('id, content, user_name, cafe_id').in('id', reviewIds)
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

  const handleDeleteCafeReport = async (id: string) => {
    if (!confirm('確定刪除此回報？')) return
    const { error } = await supabase.from('cafe_reports').delete().eq('id', id)
    if (error) { alert('刪除失敗：' + error.message); return }
    setCafeReports(prev => prev.filter(r => r.id !== id))
  }

  const handleDeleteReportedReview = async (rr: ReviewReport) => {
    if (!confirm('確定刪除留言並結案？')) return
    const { error } = await supabase.from('cafe_reviews').delete().eq('id', rr.review_id)
    if (error) { alert('刪除失敗：' + error.message); return }
    setReviewReports(prev => prev.filter(r => r.review_id !== rr.review_id))
  }

  const handleDismissReport = async (id: string) => {
    if (!confirm('確定忽略此檢舉？（留言將保留）')) return
    const { error } = await supabase.from('review_reports').delete().eq('id', id)
    if (error) { alert('操作失敗：' + error.message); return }
    setReviewReports(prev => prev.filter(r => r.id !== id))
  }

  const handleCreateCafe = async () => {
    if (!newCafeData.name.trim()) { alert('店名為必填'); return }
    if (!newCafeData.address.trim()) { alert('地址為必填'); return }
    setSaving(true)
    const { data, error } = await supabase.from('cafes').insert([newCafeData]).select().single()
    if (error) { alert('新增失敗：' + error.message); setSaving(false); return }
    const hoursToInsert = newCafeHours.map(h => ({ ...h, cafe_id: data.id }))
    const { error: ohErr } = await supabase.from('opening_hours').insert(hoursToInsert)
    if (ohErr) { alert('營業時間儲存失敗：' + ohErr.message); setSaving(false); return }
    setCafeList(prev => [...prev, data])
    setCafes(prev => ({ ...prev, [data.id]: data.name }))
    const ohRes = await supabase.from('opening_hours').select('*').eq('cafe_id', data.id)
    if (ohRes.data) setCafeOpHours(prev => ({ ...prev, [data.id]: ohRes.data }))
    setNewCafeData(EMPTY_CAFE)
    setNewCafeHours(DEFAULT_HOURS())
    setShowNewCafeForm(false)
    setSaving(false)
  }

  const handleSaveCafe = async () => {
    if (!editingCafe) return
    if (!editingCafe.name.trim()) { alert('店名為必填'); return }
    setSaving(true)
    const { id, ...rest } = editingCafe
    const { error } = await supabase.from('cafes').update(rest).eq('id', id)
    if (error) { alert('儲存失敗：' + error.message); setSaving(false); return }
    for (const h of editingHours) {
      if (h.id) {
        await supabase.from('opening_hours').update({
          open_time: h.open_time, close_time: h.close_time, is_closed: h.is_closed
        }).eq('id', h.id)
      } else {
        await supabase.from('opening_hours').insert({ ...h, cafe_id: id })
      }
    }
    setCafeList(prev => prev.map(c => c.id === id ? editingCafe : c))
    setCafes(prev => ({ ...prev, [id]: editingCafe.name }))
    setCafeOpHours(prev => ({ ...prev, [id]: editingHours }))
    setEditingCafe(null)
    setSaving(false)
  }

  const handleDeleteCafe = async (cafe: Cafe) => {
    if (!confirm('確定刪除「' + cafe.name + '」？')) return
    await supabase.from('opening_hours').delete().eq('cafe_id', cafe.id)
    const { error } = await supabase.from('cafes').delete().eq('id', cafe.id)
    if (error) { alert('刪除失敗：' + error.message); return }
    setCafeList(prev => prev.filter(c => c.id !== cafe.id))
    setCafes(prev => { const n = { ...prev }; delete n[cafe.id]; return n })
    setCafeOpHours(prev => { const n = { ...prev }; delete n[cafe.id]; return n })
  }

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

  const IS: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid rgba(201,168,124,0.35)',
    background: '#FFFDF9', fontSize: 13, color: '#2C1A0E',
    outline: 'none', fontFamily: 'Lato, sans-serif',
  }
  const LS: React.CSSProperties = { fontSize: 11, color: '#7A5C3A', fontWeight: 700, marginBottom: 4, display: 'block' }

  const CafeFormFields = ({
    data, onChange, hours, onHourChange
  }: {
    data: Omit<Cafe,'id'>
    onChange: (k: keyof Omit<Cafe,'id'>, v: any) => void
    hours: OpeningHour[]
    onHourChange: (idx: number, k: keyof OpeningHour, v: any) => void
  }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={LS}>店名 *</label>
          <input style={IS} value={data.name} onChange={e => onChange('name', e.target.value)} placeholder="例：無名咖啡" />
        </div>
        <div>
          <label style={LS}>地址 *</label>
          <input style={IS} value={data.address} onChange={e => onChange('address', e.target.value)} placeholder="台北市..." />
        </div>
        <div>
          <label style={LS}>Google Map 連結</label>
          <input style={IS} value={data.google_map_url ?? ''} onChange={e => onChange('google_map_url', e.target.value)} placeholder="https://maps.google.com/..." />
        </div>
        <div>
          <label style={LS}>網站</label>
          <input style={IS} value={data.website ?? ''} onChange={e => onChange('website', e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label style={LS}>低消（元）</label>
          <input style={IS} type="number" value={data.min_spend ?? ''} onChange={e => onChange('min_spend', e.target.value ? Number(e.target.value) : undefined)} placeholder="0 = 無低消" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={LS}>店家標籤</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TAGS.map(({ key, emoji, label }) => {
              const active = !!data[key]
              return (
                <button key={key} type="button" onClick={() => onChange(key, !active)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 99, cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  border: active ? '1.5px solid #2C1A0E' : '1.5px solid rgba(201,168,124,0.35)',
                  background: active ? '#2C1A0E' : 'transparent',
                  color: active ? '#C9A87C' : '#7A5C3A',
                  transition: 'all 0.15s',
                }}>
                  {emoji} {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div style={{ border: '1px solid rgba(201,168,124,0.25)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ background: '#F5F0E8', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: '#7A5C3A', letterSpacing: '0.08em' }}>
          🕐 營業時間
        </div>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hours.map((h, idx) => (
            <div key={h.day_of_week} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: '#4A3728', textAlign: 'center', background: h.is_closed ? 'rgba(201,168,124,0.1)' : 'rgba(44,26,14,0.08)', borderRadius: 6, padding: '3px 0' }}>
                {DAY_NAMES[h.day_of_week]}
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7A5C3A', cursor: 'pointer' }}>
                <input type="checkbox" checked={h.is_closed} onChange={e => onHourChange(idx, 'is_closed', e.target.checked)} style={{ accentColor: '#DC2626' }} />
                公休
              </label>
              {!h.is_closed ? (
                <>
                  <input type="time" value={h.open_time} onChange={e => onHourChange(idx, 'open_time', e.target.value)} style={{ ...IS, width: 110 }} />
                  <span style={{ fontSize: 12, color: '#B09B8A' }}>—</span>
                  <input type="time" value={h.close_time} onChange={e => onHourChange(idx, 'close_time', e.target.value)} style={{ ...IS, width: 110 }} />
                </>
              ) : (
                <span style={{ fontSize: 12, color: '#B09B8A' }}>休息</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const displayedCafeReports = filterCafe ? cafeReports.filter(r => r.cafe_id === filterCafe) : cafeReports
  const cafeStats = Object.entries(
    cafeReports.reduce((acc, r) => { acc[r.cafe_id] = (acc[r.cafe_id] || 0) + 1; return acc }, {} as Record<number, number>)
  ).sort((a, b) => b[1] - a[1])
  const groupedReviewReports = reviewReports.reduce((acc, rr) => {
    if (!acc[rr.review_id]) acc[rr.review_id] = []
    acc[rr.review_id].push(rr)
    return acc
  }, {} as Record<string, ReviewReport[]>)
  const pendingCount = Object.keys(groupedReviewReports).length
  const filteredCafeList = cafeList.filter(c =>
    c.name.toLowerCase().includes(cafeSearch.toLowerCase()) ||
    c.address.toLowerCase().includes(cafeSearch.toLowerCase())
  )

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0E8' }}>
      <p style={{ fontFamily: 'Noto Serif TC', color: '#2C1A0E', fontSize: 16 }}>驗證管理員身份中...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'Lato, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,124,0.4); border-radius: 99px; }
        input[type="time"]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
      `}</style>

      <div style={{ background: '#2C1A0E', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 20px rgba(44,26,14,0.3)' }}>
        <button onClick={() => router.push('/')} style={{ background: 'rgba(201,168,124,0.15)', color: '#C9A87C', border: '1px solid rgba(201,168,124,0.3)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          ← 返回地圖
        </button>
        <div>
          <h1 style={{ fontFamily: 'Noto Serif TC', fontSize: 20, color: '#C9A87C', fontWeight: 700 }}>管理後台</h1>
          <p style={{ fontSize: 11, color: 'rgba(201,168,124,0.5)', marginTop: 2 }}>即時回報 · 留言檢舉 · 店家管理</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A87C' }}>{cafeReports.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(201,168,124,0.5)' }}>總回報數</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: pendingCount > 0 ? '#FCA5A5' : '#C9A87C' }}>{pendingCount}</div>
            <div style={{ fontSize: 10, color: 'rgba(201,168,124,0.5)' }}>待審檢舉</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A87C' }}>{cafeList.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(201,168,124,0.5)' }}>店家總數</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderBottom: '1px solid rgba(201,168,124,0.2)', padding: '0 32px', display: 'flex' }}>
        {(['reports', 'review-reports', 'cafes'] as const).map(key => {
          const labels: Record<string, string> = { 'reports': '📡 即時回報', 'review-reports': '⚑ 檢舉留言', 'cafes': '🏪 店家管理' }
          const counts: Record<string, number> = { 'reports': cafeReports.length, 'review-reports': pendingCount, 'cafes': cafeList.length }
          const isAlert = key === 'review-reports' && pendingCount > 0
          return (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: tab === key ? 700 : 400, color: tab === key ? '#2C1A0E' : '#7A5C3A',
              borderBottom: tab === key ? '2.5px solid #2C1A0E' : '2.5px solid transparent',
              fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {labels[key]}
              <span style={{
                fontSize: 10, padding: '1px 7px', borderRadius: 99, fontWeight: 700,
                background: isAlert ? '#DC2626' : (tab === key ? '#2C1A0E' : 'rgba(201,168,124,0.2)'),
                color: isAlert ? 'white' : (tab === key ? '#C9A87C' : '#7A5C3A'),
              }}>{counts[key]}</span>
            </button>
          )
        })}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {tab === 'reports' && (
          <>
            <div style={{ width: 200, flexShrink: 0, background: 'white', borderRadius: 16, padding: 16, border: '1px solid rgba(201,168,124,0.2)', boxShadow: '0 2px 10px rgba(44,26,14,0.06)', position: 'sticky', top: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#7A5C3A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>按店家篩選</p>
              <button onClick={() => setFilterCafe(null)} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4, background: filterCafe === null ? '#2C1A0E' : 'transparent', color: filterCafe === null ? '#C9A87C' : '#4A3728', fontWeight: filterCafe === null ? 700 : 400, fontSize: 13 }}>
                全部 <span style={{ float: 'right', fontSize: 11, opacity: 0.7 }}>{cafeReports.length}</span>
              </button>
              {cafeStats.map(([id, count]) => (
                <button key={id} onClick={() => setFilterCafe(Number(id))} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4, background: filterCafe === Number(id) ? '#2C1A0E' : 'transparent', color: filterCafe === Number(id) ? '#C9A87C' : '#4A3728', fontWeight: filterCafe === Number(id) ? 700 : 400, fontSize: 12, lineHeight: 1.4 }}>
                  {cafes[Number(id)] ?? '#' + id}
                  <span style={{ float: 'right', fontSize: 11, opacity: 0.6 }}>{count}</span>
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'Noto Serif TC', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>
                  {filterCafe ? cafes[filterCafe] + ' 的回報' : '所有即時回報'}
                </h2>
                <span style={{ background: '#2C1A0E', color: '#C9A87C', fontSize: 11, padding: '2px 10px', borderRadius: 99, fontWeight: 700 }}>{displayedCafeReports.length} 筆</span>
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
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', fontFamily: 'Noto Serif TC', lineHeight: 1.4 }}>{cafes[r.cafe_id] ?? '#' + r.cafe_id}</div>
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
                        <button onClick={() => handleDeleteCafeReport(r.id)} style={{ background: 'rgba(220,38,38,0.07)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          🗑️ 刪除
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'review-reports' && (
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Noto Serif TC', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>用戶檢舉留言</h2>
              {pendingCount > 0 && <span style={{ background: '#DC2626', color: 'white', fontSize: 11, padding: '2px 10px', borderRadius: 99, fontWeight: 700 }}>{pendingCount} 則待審</span>}
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
                  const cafeName = first.review_cafe_id ? (cafes[first.review_cafe_id] ?? '店家 #' + first.review_cafe_id) : '—'
                  return (
                    <div key={reviewId} style={{ background: 'white', borderRadius: 16, border: '1.5px solid rgba(220,38,38,0.2)', boxShadow: '0 2px 12px rgba(44,26,14,0.07)', overflow: 'hidden' }}>
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
                            <div style={{ background: '#FFF8F0', border: '1px solid rgba(201,168,124,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2C1A0E', lineHeight: 1.7 }}>
                              {first.review_content ?? '（留言已刪除）'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => handleDeleteReportedReview(first)} style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                              🗑️ 刪除留言
                            </button>
                            {rrs.map(rr => (
                              <button key={rr.id} onClick={() => handleDismissReport(rr.id)} style={{ background: 'rgba(107,114,128,0.07)', color: '#6B7280', border: '1px solid rgba(107,114,128,0.2)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                ✓ 忽略此檢舉
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '10px 18px', background: 'rgba(254,242,242,0.5)' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#B91C1C', letterSpacing: '0.08em', marginBottom: 8 }}>共 {rrs.length} 人檢舉</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {rrs.map(rr => (
                            <div key={rr.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, padding: '4px 10px' }}>
                              <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>{rr.reason}</span>
                              <span style={{ fontSize: 10, color: '#B09B8A' }}>{new Date(rr.created_at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}</span>
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

        {tab === 'cafes' && (
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <input style={{ ...IS, flex: 1, padding: '10px 14px' }} placeholder="🔍 搜尋店名或地址..." value={cafeSearch} onChange={e => setCafeSearch(e.target.value)} />
              <button onClick={() => { setShowNewCafeForm(true); setEditingCafe(null) }} style={{ background: '#2C1A0E', color: '#C9A87C', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                ＋ 新增店家
              </button>
            </div>

            {showNewCafeForm && (
              <div style={{ background: 'white', borderRadius: 16, border: '2px solid rgba(44,26,14,0.2)', boxShadow: '0 4px 20px rgba(44,26,14,0.1)', marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ background: '#2C1A0E', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Noto Serif TC', fontSize: 14, color: '#C9A87C', fontWeight: 700 }}>新增店家</span>
                  <button onClick={() => setShowNewCafeForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(201,168,124,0.6)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
                </div>
                <div style={{ padding: 20 }}>
                  <CafeFormFields
                    data={newCafeData}
                    onChange={(k, v) => setNewCafeData(prev => ({ ...prev, [k]: v }))}
                    hours={newCafeHours}
                    onHourChange={(idx, k, v) => setNewCafeHours(prev => prev.map((h, i) => i === idx ? { ...h, [k]: v } : h))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                    <button onClick={() => setShowNewCafeForm(false)} style={{ background: 'transparent', color: '#7A5C3A', border: '1px solid rgba(201,168,124,0.4)', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontSize: 13 }}>取消</button>
                    <button onClick={handleCreateCafe} disabled={saving} style={{ background: saving ? '#B09B8A' : '#2C1A0E', color: '#C9A87C', border: 'none', borderRadius: 10, padding: '9px 24px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
                      {saving ? '儲存中...' : '✓ 建立店家'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {filteredCafeList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#B09B8A', background: 'white', borderRadius: 16, border: '1px solid rgba(201,168,124,0.15)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
                <p style={{ fontSize: 14 }}>找不到符合的店家</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredCafeList.map(cafe => {
                  const isEditing = editingCafe?.id === cafe.id
                  return (
                    <div key={cafe.id} style={{ background: 'white', borderRadius: 14, border: isEditing ? '2px solid rgba(44,26,14,0.25)' : '1px solid rgba(201,168,124,0.18)', boxShadow: '0 2px 8px rgba(44,26,14,0.06)', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #2C1A0E, #7A5C3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A87C', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                          {cafe.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', fontFamily: 'Noto Serif TC' }}>{cafe.name}</div>
                          <div style={{ fontSize: 11, color: '#B09B8A', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cafe.address}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 260 }}>
                          {TAGS.filter(t => !!cafe[t.key]).map(t => (
                            <span key={t.key} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(44,26,14,0.07)', color: '#7A5C3A', fontWeight: 700 }}>
                              {t.emoji} {t.label}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button onClick={() => {
                            if (isEditing) { setEditingCafe(null) }
                            else { setEditingCafe(cafe); setEditingHours(cafeOpHours[cafe.id] ? [...cafeOpHours[cafe.id]] : DEFAULT_HOURS()); setShowNewCafeForm(false) }
                          }} style={{ background: isEditing ? 'rgba(44,26,14,0.08)' : 'rgba(201,168,124,0.12)', color: isEditing ? '#2C1A0E' : '#7A5C3A', border: '1px solid rgba(201,168,124,0.3)', borderRadius: 9, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                            {isEditing ? '✕ 收起' : '✏️ 編輯'}
                          </button>
                          <button onClick={() => handleDeleteCafe(cafe)} style={{ background: 'rgba(220,38,38,0.07)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 9, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                            🗑️ 刪除
                          </button>
                        </div>
                      </div>
                      {isEditing && editingCafe && (
                        <div style={{ borderTop: '1px solid rgba(201,168,124,0.2)', padding: 20, background: '#FFFDF9' }}>
                          <CafeFormFields
                            data={editingCafe}
                            onChange={(k, v) => setEditingCafe(prev => prev ? { ...prev, [k]: v } : prev)}
                            hours={editingHours}
                            onHourChange={(idx, k, v) => setEditingHours(prev => prev.map((h, i) => i === idx ? { ...h, [k]: v } : h))}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                            <button onClick={() => setEditingCafe(null)} style={{ background: 'transparent', color: '#7A5C3A', border: '1px solid rgba(201,168,124,0.4)', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontSize: 13 }}>取消</button>
                            <button onClick={handleSaveCafe} disabled={saving} style={{ background: saving ? '#B09B8A' : '#2C1A0E', color: '#C9A87C', border: 'none', borderRadius: 10, padding: '9px 24px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
                              {saving ? '儲存中...' : '✓ 儲存變更'}
                            </button>
                          </div>
                        </div>
                      )}
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