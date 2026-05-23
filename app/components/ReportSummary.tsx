'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
 
type Summary = {
  ac: number
  quiet: number
  latestSeat: string
  total: number
}
 
export default function ReportSummary({ cafeId }: { cafeId: number }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const supabase = createClient()
 
  useEffect(() => {
    const load = async () => {
      const hourStart = new Date()
      hourStart.setMinutes(0, 0, 0)
 
      const { data } = await supabase
        .from('cafe_reports')
        .select('ac_level, quiet_level, seat_status, created_at')
        .eq('cafe_id', cafeId)
        .gte('created_at', hourStart.toISOString())
        .order('created_at', { ascending: false }) // 最新的排第一
 
      if (!data || data.length === 0) { setSummary(null); return }
 
      const acAvg = data.reduce((s, r) => s + (r.ac_level ?? 0), 0) / data.length
      const quietAvg = data.reduce((s, r) => s + (r.quiet_level ?? 0), 0) / data.length
 
      // 空位程度取最新一筆
      const latestSeat = data[0].seat_status ?? 'green'
 
      setSummary({ ac: acAvg, quiet: quietAvg, latestSeat, total: data.length })
    }
    load()
  }, [cafeId])
 
  if (!summary) return null
 
  const seatConfig: Record<string, { color: string; label: string; bg: string; border: string }> = {
    green:  { color: '#22C55E', label: '位置充足', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)'  },
    yellow: { color: '#F59E0B', label: '還有位置', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    red:    { color: '#EF4444', label: '幾乎客滿', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)'  },
  }
  const seat = seatConfig[summary.latestSeat]
 
  const ScoreBar = ({ value, label }: { value: number; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: '#7A5C3A', minWidth: 72 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: 'rgba(201,168,124,0.15)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${(value / 5) * 100}%`,
          background: 'linear-gradient(to right, #C9A87C, #2C1A0E)',
          borderRadius: 99,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#2C1A0E', minWidth: 24, textAlign: 'right' }}>
        {value.toFixed(1)}
      </span>
    </div>
  )
 
  return (
    <div style={{
      marginBottom: 16,
      background: 'white', borderRadius: 14,
      padding: '14px 16px',
      border: '1px solid rgba(201,168,124,0.18)',
      boxShadow: '0 2px 8px rgba(44,26,14,0.05)',
    }}>
      {/* 標題 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#C9A87C' }}>📡</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#2C1A0E', fontFamily: "'Noto Serif TC', serif" }}>
            即時狀況
          </span>
        </div>
        <span style={{ fontSize: 10, color: '#B09B8A' }}>
          本小時 · {summary.total} 人回報
        </span>
      </div>
 
      {/* 分數 bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <ScoreBar value={summary.ac} label="❄️ 冷氣強度" />
        <ScoreBar value={summary.quiet} label="🤫 安靜程度" />
      </div>
 
      {/* 空位狀態（最新一筆） */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 12px', borderRadius: 10,
        background: seat.bg,
        border: `1px solid ${seat.border}`,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: seat.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: seat.color }}>💺 {seat.label}</span>
        <span style={{ fontSize: 10, color: '#B09B8A', marginLeft: 'auto' }}>最新回報</span>
      </div>
    </div>
  )
}
 