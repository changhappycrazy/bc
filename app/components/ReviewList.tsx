'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'

const REPORT_REASONS = [
  '內容不實',
  '人身攻擊 / 惡意言論',
  '廣告 / 垃圾訊息',
  '與此店家無關',
  '其他',
]

export default function ReviewList({ cafeId, isAdmin = false }: { cafeId: number; isAdmin?: boolean }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // 檢舉相關
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState<string>('')
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set()) // 從 DB 查
  const [submittingReport, setSubmittingReport] = useState(false)

  const editFileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const [{ data: reviews }, { data: myReports }] = await Promise.all([
        supabase.from('cafe_reviews').select('*').eq('cafe_id', cafeId).order('created_at', { ascending: false }),
        user
          ? supabase.from('review_reports').select('review_id').eq('reporter_id', user.id)
          : Promise.resolve({ data: [] }),
      ])

      if (reviews) setReviews(reviews)
      if (myReports) setReportedIds(new Set(myReports.map((r: any) => r.review_id)))
      setLoading(false)
    }
    init()
  }, [cafeId])

  // ── 編輯相關（原有邏輯不動）──────────────────────────
  const handleEdit = (rv: any) => {
    setEditingId(rv.id)
    setEditContent(rv.content)
    setEditImageFile(null)
    setEditImagePreview(null)
    setRemoveExistingImage(false)
    setReportingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
    setEditImageFile(null)
    setEditImagePreview(null)
    setRemoveExistingImage(false)
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('圖片請小於 5MB'); return }
    setEditImageFile(file)
    setEditImagePreview(URL.createObjectURL(file))
    setRemoveExistingImage(false)
  }

  const handleSave = async (rv: any) => {
    if (!editContent.trim()) return
    setSavingId(rv.id)
    const { data: { user } } = await supabase.auth.getUser()
    let newImageUrl: string | null | undefined = undefined

    if (removeExistingImage && !editImageFile) {
      newImageUrl = null
    } else if (editImageFile) {
      const ext = editImageFile.name.split('.').pop()
      const filePath = `${user?.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('review-images').upload(filePath, editImageFile)
      if (uploadError) { alert('圖片上傳失敗：' + uploadError.message); setSavingId(null); return }
      const { data: { publicUrl } } = supabase.storage.from('review-images').getPublicUrl(filePath)
      newImageUrl = publicUrl
    }

    const updateObj: any = { content: editContent }
    if (newImageUrl !== undefined) updateObj.image_url = newImageUrl

    const { error } = await supabase.from('cafe_reviews').update(updateObj).eq('id', rv.id)
    if (error) {
      alert('更新失敗：' + error.message)
    } else {
      setReviews(prev => prev.map(r =>
        r.id === rv.id
          ? { ...r, content: editContent, image_url: newImageUrl !== undefined ? newImageUrl : r.image_url }
          : r
      ))
      handleCancelEdit()
    }
    setSavingId(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這則評論嗎？')) return
    setDeletingId(id)
    const { error } = await supabase.from('cafe_reviews').delete().eq('id', id)
    if (error) {
      alert('刪除失敗：' + error.message)
      setDeletingId(null)
    } else {
      setTimeout(() => {
        setReviews(prev => prev.filter(r => r.id !== id))
        setDeletingId(null)
      }, 250)
    }
  }

  // ── 檢舉相關 ──────────────────────────────────────────
  const openReport = (reviewId: string) => {
    setReportingId(reviewId)
    setReportReason('')
    setEditingId(null)
  }

  const closeReport = () => {
    setReportingId(null)
    setReportReason('')
  }

  const handleSubmitReport = async (rv: any) => {
    if (!reportReason) { alert('請選擇檢舉原因'); return }
    setSubmittingReport(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('請先登入'); setSubmittingReport(false); return }

    const { error } = await supabase.from('review_reports').insert({
      review_id: rv.id,
      reporter_id: user.id,
      reason: reportReason,
    })

    if (error) {
      if (error.code === '23505') {
        // unique constraint → 已檢舉過
        alert('您已經檢舉過這則留言了！')
      } else {
        alert('檢舉失敗：' + error.message)
      }
    } else {
      setReportedIds(prev => new Set(prev).add(rv.id))
      closeReport()
    }
    setSubmittingReport(false)
  }

  return (
    <div className="mt-8">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: scale(0.97); }
        }
        @keyframes reportPanelIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .review-item { animation: fadeSlideIn 0.35s ease both; }
        .review-item.deleting { animation: fadeOut 0.25s ease forwards; }
        .review-scroll::-webkit-scrollbar { width: 4px; }
        .review-scroll::-webkit-scrollbar-track { background: transparent; }
        .review-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,124,0.35); border-radius: 99px; }
        .icon-btn {
          background: none; border: none; cursor: pointer;
          padding: 4px 8px; border-radius: 8px; font-size: 11px;
          font-weight: 600; transition: all 0.2s; line-height: 1;
        }
        .edit-btn { color: #7A5C3A; }
        .edit-btn:hover { background: rgba(201,168,124,0.15); color: #2C1A0E; }
        .delete-btn { color: #B09B8A; }
        .delete-btn:hover { background: rgba(220,80,60,0.08); color: #c0392b; }
        .admin-delete-btn { color: #DC2626; }
        .admin-delete-btn:hover { background: rgba(220,38,38,0.1); color: #b91c1c; }
        .report-btn { color: #B09B8A; }
        .report-btn:hover { background: rgba(245,158,11,0.1); color: #D97706; }
        .report-btn.reported { color: #D97706; cursor: default; }
        .edit-textarea {
          width: 100%; background: #FFFDF9;
          border: 1.5px solid #C9A87C; border-radius: 10px;
          padding: 10px 12px; font-size: 13px; color: #2C1A0E;
          line-height: 1.75; resize: none; outline: none;
          box-shadow: 0 0 0 3px rgba(201,168,124,0.12);
          font-family: 'Lato', sans-serif;
        }
        .save-btn {
          padding: 5px 14px; border-radius: 8px; border: none;
          background: #2C1A0E; color: #C9A87C; font-size: 11px;
          font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .save-btn:hover:not(:disabled) { background: #3D2614; }
        .save-btn:disabled { background: #C4B5A5; cursor: not-allowed; }
        .cancel-btn {
          padding: 5px 12px; border-radius: 8px; font-size: 11px;
          font-weight: 600; cursor: pointer; transition: all 0.2s;
          background: transparent; border: 1px solid rgba(201,168,124,0.3); color: #7A5C3A;
        }
        .cancel-btn:hover { background: rgba(201,168,124,0.1); }
        .review-image {
          margin-top: 10px; width: 100%; max-height: 180px;
          object-fit: cover; border-radius: 8px;
          border: 1px solid rgba(201,168,124,0.2);
          cursor: pointer; transition: opacity 0.2s; display: block;
        }
        .review-image:hover { opacity: 0.92; }
        .edit-upload-label {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 8px; cursor: pointer;
          background: white; border: 1.5px solid rgba(201,168,124,0.35);
          font-size: 11px; color: #7A5C3A; font-weight: 600;
          transition: all 0.2s;
        }
        .edit-upload-label:hover { background: #FDF8F2; border-color: #C9A87C; }
        .remove-img-overlay-btn {
          position: absolute; top: 6px; right: 6px;
          background: rgba(44,26,14,0.65); color: white;
          border: none; border-radius: 50%;
          width: 22px; height: 22px; cursor: pointer;
          font-size: 11px; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .remove-img-overlay-btn:hover { background: rgba(44,26,14,0.9); }
        .image-lightbox {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.85);
          display: flex; align-items: center; justify-content: center;
          cursor: zoom-out;
        }
        .image-lightbox img {
          max-width: 90vw; max-height: 90vh;
          border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        /* 檢舉面板 */
        .report-panel {
          animation: reportPanelIn 0.2s ease;
          margin-top: 10px;
          background: #FFFBF5;
          border: 1.5px solid rgba(245,158,11,0.3);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .report-reason-btn {
          display: block; width: 100%;
          text-align: left; padding: 7px 12px;
          border-radius: 8px; border: 1.5px solid transparent;
          background: white; color: #4A3728; font-size: 12px;
          cursor: pointer; transition: all 0.15s; font-weight: 500;
        }
        .report-reason-btn:hover { border-color: rgba(245,158,11,0.4); background: rgba(245,158,11,0.05); }
        .report-reason-btn.selected {
          border-color: #D97706; background: rgba(245,158,11,0.1);
          color: #92400E; font-weight: 700;
        }
        .report-submit-btn {
          width: 100%; padding: 8px; border-radius: 8px; border: none;
          background: #D97706; color: white; font-size: 12px;
          font-weight: 700; cursor: pointer; transition: all 0.2s;
          margin-top: 8px;
        }
        .report-submit-btn:hover:not(:disabled) { background: #B45309; }
        .report-submit-btn:disabled { background: #C4B5A5; cursor: not-allowed; }
      `}</style>

      <LightboxProvider>
        {(lightboxSrc, openLightbox, closeLightbox) => (
          <>
            {lightboxSrc && (
              <div className="image-lightbox" onClick={closeLightbox}>
                <img src={lightboxSrc} alt="full size" onClick={e => e.stopPropagation()} />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 18, color: '#C9A87C' }}>✦</span>
              <h3 style={{ fontFamily: "'Noto Serif TC', serif", fontSize: 15, fontWeight: 700, color: '#2C1A0E', letterSpacing: '0.05em' }}>
                <br />咖啡友評論
              </h3>
              {reviews.length > 0 && (
                <span style={{ marginLeft: 4, background: '#2C1A0E', color: '#C9A87C', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '2px 8px' }}>
                  {reviews.length}
                </span>
              )}
              {isAdmin && (
                <span style={{ marginLeft: 4, background: '#DC2626', color: 'white', fontSize: 9, fontWeight: 700, borderRadius: 99, padding: '2px 8px', letterSpacing: '0.05em' }}>
                  管理員模式
                </span>
              )}
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(201,168,124,0.4), transparent)' }} />
            </div>

            <div className="review-scroll" style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#C9A87C', fontSize: 13, opacity: 0.7 }}>☕ 載入中...</div>
              ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(201,168,124,0.06)', borderRadius: 14, border: '1.5px dashed rgba(201,168,124,0.25)' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>☕</div>
                  <p style={{ fontSize: 12, color: '#B09B8A', fontStyle: 'italic', lineHeight: 1.7 }}>目前還沒有評論<br />快來當第一個留下心得的人！</p>
                </div>
              ) : (
                reviews.map((rv, i) => {
                  const isOwner = currentUserId === rv.user_id
                  const isEditingThis = editingId === rv.id
                  const isReportingThis = reportingId === rv.id
                  const isDeleting = deletingId === rv.id
                  const alreadyReported = reportedIds.has(rv.id)
                  const editingCurrentImage = removeExistingImage ? null : rv.image_url
                  const editingDisplayImage = editImagePreview ?? editingCurrentImage

                  return (
                    <div
                      key={rv.id}
                      className={`review-item${isDeleting ? ' deleting' : ''}`}
                      style={{
                        animationDelay: `${i * 0.06}s`,
                        background: 'white', borderRadius: 14, padding: '13px 16px',
                        border: `1px solid ${isEditingThis ? '#C9A87C' : isReportingThis ? 'rgba(245,158,11,0.35)' : isAdmin && !isOwner ? 'rgba(220,38,38,0.15)' : 'rgba(201,168,124,0.18)'}`,
                        boxShadow: '0 2px 8px rgba(44,26,14,0.05)', transition: 'border-color 0.2s',
                      }}
                    >
                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #2C1A0E, #7A5C3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A87C', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {rv.user_name?.charAt(0) || '?'}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#4A3728', fontFamily: "'Noto Serif TC', serif" }}>
                            {rv.user_name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 10, color: '#C9A87C', background: 'rgba(201,168,124,0.1)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                            {new Date(rv.created_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                          </span>

                          {!isEditingThis && !isReportingThis && (
                            <>
                              {isOwner && (
                                <button className="icon-btn edit-btn" onClick={() => handleEdit(rv)}>✏️ 編輯</button>
                              )}
                              {(isOwner || isAdmin) && (
                                <button
                                  className={`icon-btn ${isAdmin && !isOwner ? 'admin-delete-btn' : 'delete-btn'}`}
                                  onClick={() => handleDelete(rv.id)}
                                  disabled={isDeleting}
                                >
                                  🗑️{isAdmin && !isOwner ? ' 管理刪除' : ''}
                                </button>
                              )}
                              {/* 檢舉按鈕：非自己的留言、非管理員模式才顯示 */}
                              {!isOwner && !isAdmin && currentUserId && (
                                <button
                                  className={`icon-btn report-btn${alreadyReported ? ' reported' : ''}`}
                                  onClick={() => !alreadyReported && openReport(rv.id)}
                                  title={alreadyReported ? '已檢舉' : '檢舉此留言'}
                                >
                                  {alreadyReported ? '⚑ 已檢舉' : '⚐ 檢舉'}
                                </button>
                              )}
                            </>
                          )}

                          {isReportingThis && (
                            <button className="icon-btn cancel-btn" style={{ fontSize: 11 }} onClick={closeReport}>✕ 取消</button>
                          )}
                        </div>
                      </div>

                      {/* 編輯模式 */}
                      {isEditingThis ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <textarea
                            className="edit-textarea"
                            rows={3}
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            autoFocus
                          />
                          <div>
                            {editingDisplayImage ? (
                              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                                <img
                                  src={editingDisplayImage}
                                  alt="preview"
                                  style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(201,168,124,0.3)', display: 'block' }}
                                />
                                <button
                                  type="button"
                                  className="remove-img-overlay-btn"
                                  onClick={() => {
                                    if (editImageFile) {
                                      setEditImageFile(null)
                                      setEditImagePreview(null)
                                      if (editFileInputRef.current) editFileInputRef.current.value = ''
                                    } else {
                                      setRemoveExistingImage(true)
                                    }
                                  }}
                                >✕</button>
                              </div>
                            ) : (
                              <label className="edit-upload-label">
                                📷 {rv.image_url ? '更換照片' : '新增照片'}
                                <input
                                  ref={editFileInputRef}
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={handleEditImageChange}
                                />
                              </label>
                            )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button className="cancel-btn" onClick={handleCancelEdit}>取消</button>
                            <button className="save-btn" onClick={() => handleSave(rv)} disabled={savingId === rv.id}>
                              {savingId === rv.id ? '儲存中...' : '儲存'}
                            </button>
                          </div>
                        </div>
                      ) : isReportingThis ? (
                        /* 檢舉面板 */
                        <div className="report-panel">
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 8, letterSpacing: '0.04em' }}>
                            ⚑ 請選擇檢舉原因
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {REPORT_REASONS.map(reason => (
                              <button
                                key={reason}
                                className={`report-reason-btn${reportReason === reason ? ' selected' : ''}`}
                                onClick={() => setReportReason(reason)}
                              >
                                {reportReason === reason ? '● ' : '○ '}{reason}
                              </button>
                            ))}
                          </div>
                          <button
                            className="report-submit-btn"
                            onClick={() => handleSubmitReport(rv)}
                            disabled={!reportReason || submittingReport}
                          >
                            {submittingReport ? '送出中...' : '確認檢舉'}
                          </button>
                          <p style={{ fontSize: 10, color: '#B09B8A', marginTop: 6, textAlign: 'center' }}>
                            感謝您的回報，我們會盡快審查
                          </p>
                        </div>
                      ) : (
                        /* 正常顯示 */
                        <>
                          <p style={{ fontSize: 13, color: '#2C1A0E', lineHeight: 1.75, letterSpacing: '0.01em' }}>{rv.content}</p>
                          {rv.image_url && (
                            <img
                              src={rv.image_url}
                              alt="review"
                              className="review-image"
                              onClick={() => openLightbox(rv.image_url)}
                              title="點擊放大"
                            />
                          )}
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </LightboxProvider>
    </div>
  )
}

function LightboxProvider({ children }: {
  children: (src: string | null, open: (src: string) => void, close: () => void) => React.ReactNode
}) {
  const [src, setSrc] = useState<string | null>(null)
  return <>{children(src, setSrc, () => setSrc(null))}</>
}