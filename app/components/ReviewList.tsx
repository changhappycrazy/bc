'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
 
export default function ReviewList({ cafeId }: { cafeId: number }) {
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
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
 
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const [{ data: { user } }, { data: reviews }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('cafe_reviews').select('*').eq('cafe_id', cafeId).order('created_at', { ascending: false })
      ])
      setCurrentUserId(user?.id ?? null)
      if (reviews) setReviews(reviews)
      setLoading(false)
    }
    init()
  }, [cafeId])
 
  const handleEdit = (rv: any) => {
    setEditingId(rv.id)
    setEditContent(rv.content)
    setEditImageFile(null)
    setEditImagePreview(null)
    setRemoveExistingImage(false)
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
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片請小於 5MB')
      return
    }
    setEditImageFile(file)
    setEditImagePreview(URL.createObjectURL(file))
    setRemoveExistingImage(false)
  }
 
  const handleSave = async (rv: any) => {
    if (!editContent.trim()) return
    setSavingId(rv.id)
 
    const { data: { user } } = await supabase.auth.getUser()
 
    // undefined = 不動, null = 刪除, string = 新圖片
    let newImageUrl: string | null | undefined = undefined
 
    if (removeExistingImage && !editImageFile) {
      newImageUrl = null
    } else if (editImageFile) {
      const ext = editImageFile.name.split('.').pop()
      const filePath = `${user?.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('review-images')
        .upload(filePath, editImageFile)
 
      if (uploadError) {
        alert('圖片上傳失敗：' + uploadError.message)
        setSavingId(null)
        return
      }
 
      const { data: { publicUrl } } = supabase.storage
        .from('review-images')
        .getPublicUrl(filePath)
      newImageUrl = publicUrl
    }
 
    const updateObj: any = { content: editContent }
    if (newImageUrl !== undefined) updateObj.image_url = newImageUrl
 
    const { error } = await supabase
      .from('cafe_reviews')
      .update(updateObj)
      .eq('id', rv.id)
 
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
      `}</style>
 
      <LightboxProvider>
        {(lightboxSrc, openLightbox, closeLightbox) => (
          <>
            {lightboxSrc && (
              <div className="image-lightbox" onClick={closeLightbox}>
                <img src={lightboxSrc} alt="full size" onClick={e => e.stopPropagation()} />
              </div>
            )}
 
            {/* 標題列 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 18, color: '#C9A87C' }}>✦</span>
              <h3 style={{ fontFamily: "'Noto Serif TC', serif", fontSize: 15, fontWeight: 700, color: '#2C1A0E', letterSpacing: '0.05em' }}>
                <br></br>咖啡友評論
              </h3>
              {reviews.length > 0 && (
                <span style={{ marginLeft: 4, background: '#2C1A0E', color: '#C9A87C', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '2px 8px' }}>
                  {reviews.length}
                </span>
              )}
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(201,168,124,0.4), transparent)' }} />
            </div>
 
            {/* 評論列表 */}
            <div className="review-scroll" style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#C9A87C', fontSize: 13, opacity: 0.7 }}>☕ 載入中...</div>
              ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(201,168,124,0.06)', borderRadius: 14, border: '1.5px dashed rgba(201,168,124,0.25)' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>☕</div>
                  <p style={{ fontSize: 12, color: '#B09B8A', fontStyle: 'italic', lineHeight: 1.7 }}>目前還沒有評論<br/>快來當第一個留下心得的人！</p>
                </div>
              ) : (
                reviews.map((rv, i) => {
                  const isOwner = currentUserId === rv.user_id
                  const isEditing = editingId === rv.id
                  const isDeleting = deletingId === rv.id
 
                  // 編輯模式下的圖片顯示邏輯
                  const editingCurrentImage = removeExistingImage ? null : rv.image_url
                  const editingDisplayImage = editImagePreview ?? editingCurrentImage
 
                  return (
                    <div
                      key={rv.id}
                      className={`review-item${isDeleting ? ' deleting' : ''}`}
                      style={{
                        animationDelay: `${i * 0.06}s`,
                        background: 'white', borderRadius: 14, padding: '13px 16px',
                        border: `1px solid ${isEditing ? '#C9A87C' : 'rgba(201,168,124,0.18)'}`,
                        boxShadow: '0 2px 8px rgba(44,26,14,0.05)', transition: 'border-color 0.2s',
                      }}
                    >
                      {/* 用戶列 */}
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
                          {isOwner && !isEditing && (
                            <>
                              <button className="icon-btn edit-btn" onClick={() => handleEdit(rv)}>✏️ 編輯</button>
                              <button className="icon-btn delete-btn" onClick={() => handleDelete(rv.id)} disabled={isDeleting}>🗑️</button>
                            </>
                          )}
                        </div>
                      </div>
 
                      {/* 內文 or 編輯框 */}
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <textarea
                            className="edit-textarea"
                            rows={3}
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            autoFocus
                          />
 
                          {/* 編輯模式圖片區 */}
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
                                      // 清掉新上傳的預覽，回到原有圖片
                                      setEditImageFile(null)
                                      setEditImagePreview(null)
                                      if (editFileInputRef.current) editFileInputRef.current.value = ''
                                    } else {
                                      // 標記刪除原有圖片
                                      setRemoveExistingImage(true)
                                    }
                                  }}
                                >
                                  ✕
                                </button>
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
                      ) : (
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
 