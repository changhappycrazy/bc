'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
 
export default function ReportForm({ cafeId }: { cafeId: number }) {
  const [ac, setAc] = useState<number | null>(null)
  const [quiet, setQuiet] = useState<number | null>(null)
  const [seat, setSeat] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existingReportId, setExistingReportId] = useState<string | null>(null)
  const supabase = createClient()
 
  useEffect(() => {
    setAc(null)
    setQuiet(null)
    setSeat(null)
    setExistingReportId(null)
    setSubmitted(false)
 
    const checkExisting = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
 
      const hourStart = new Date()
      hourStart.setMinutes(0, 0, 0)
 
      const { data } = await supabase
        .from('cafe_reports')
        .select('id, ac_level, quiet_level, seat_status')
        .eq('cafe_id', cafeId)
        .eq('user_id', user.id)
        .gte('created_at', hourStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
 
      if (data) {
        setExistingReportId(data.id)
        setAc(data.ac_level)
        setQuiet(data.quiet_level)
        setSeat(data.seat_status)
      }
    }
    checkExisting()
  }, [cafeId])
 
  const handleSubmit = async () => {
    if (!ac || !quiet || !seat) { alert('請填寫所有項目'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('請先登入'); setLoading(false); return }
 
    let error = null
 
    if (existingReportId) {
      // 更新時同步更新 created_at，讓此筆成為最新回報
      const res = await supabase
        .from('cafe_reports')
        .update({
          ac_level: ac,
          quiet_level: quiet,
          seat_status: seat,
          created_at: new Date().toISOString(),
        })
        .eq('id', existingReportId)
      error = res.error
    } else {
      const res = await supabase.from('cafe_reports').insert({
        cafe_id: cafeId, user_id: user.id,
        ac_level: ac, quiet_level: quiet, seat_status: seat
      })
      error = res.error
      if (!error) {
        const { data } = await supabase
          .from('cafe_reports')
          .select('id')
          .eq('cafe_id', cafeId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (data) setExistingReportId(data.id)
      }
    }
 
    if (error) {
      alert('回報失敗：' + error.message)
    } else {
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
    setLoading(false)
  }
 
  const ScoreRow = ({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: '#7A5C3A', fontWeight: 600, minWidth: 76 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1,2,3,4,5].map(n => (
          <button
            key={n} type="button"
            onClick={() => onChange(n)}
            style={{
              width: 28, height: 28, borderRadius: '50%', border: 'none',
              background: value !== null && n <= value ? '#2C1A0E' : 'rgba(201,168,124,0.15)',
              color: value !== null && n <= value ? '#C9A87C' : '#B09B8A',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >{n}</button>
        ))}
      </div>
    </div>
  )
 
  const seatOptions = [
    { value: 'green',  label: '位置充足', color: '#22C55E', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)'  },
    { value: 'yellow', label: '還有位置', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    { value: 'red',    label: '幾乎客滿', color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  },
  ]
 
  return (
    <div style={{ marginTop: 12, background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(201,168,124,0.18)', boxShadow: '0 2px 8px rgba(44,26,14,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: '#C9A87C' }}>📡</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#2C1A0E', fontFamily: "'Noto Serif TC', serif", letterSpacing: '0.04em' }}>即時回報</span>
        <span style={{ fontSize: 10, color: '#B09B8A' }}>
          {existingReportId ? '（本小時已回報，可修改）' : '（每小時限一次）'}
        </span>
      </div>
 
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ScoreRow label="❄️ 冷氣強度" value={ac} onChange={setAc} />
        <ScoreRow label="🤫 安靜程度" value={quiet} onChange={setQuiet} />
 
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#7A5C3A', fontWeight: 600, minWidth: 76 }}>💺 空位程度</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {seatOptions.map(opt => (
              <button
                key={opt.value} type="button"
                onClick={() => setSeat(opt.value)}
                style={{
                  padding: '4px 8px', borderRadius: 20,
                  border: `1.5px solid ${seat === opt.value ? opt.color : opt.border}`,
                  background: seat === opt.value ? opt.bg : 'white',
                  color: seat === opt.value ? opt.color : '#B09B8A',
                  fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: opt.color, display: 'inline-block', flexShrink: 0 }} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
 
      <button
        onClick={handleSubmit}
        disabled={loading || submitted}
        style={{
          marginTop: 14, width: '100%', padding: '9px', borderRadius: 10, border: 'none',
          background: submitted ? '#22C55E' : '#2C1A0E',
          color: submitted ? 'white' : '#C9A87C',
          fontSize: 12, fontWeight: 700,
          cursor: loading || submitted ? 'default' : 'pointer',
          transition: 'all 0.3s', letterSpacing: '0.04em',
        }}
      >
        {submitted ? '✓ 回報成功！' : loading ? '送出中...' : existingReportId ? '更新回報' : '送出即時回報'}
      </button>
    </div>
  )
}
 