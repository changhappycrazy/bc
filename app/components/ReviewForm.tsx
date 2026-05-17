'use client'
import { useState, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
 
export default function ReviewForm({ cafeId }: { cafeId: number }) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
 
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片請小於 5MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }
 
  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
 
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
 
    if (!user) {
      alert('請先登入才能發表評論喔！')
      setLoading(false)
      return
    }
 
    const userName = user.user_metadata.display_name || user.user_metadata.full_name || '咖啡愛好者'
 
    // 上傳圖片（如果有）
    let imageUrl: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('review-images')
        .upload(filePath, imageFile)
 
      if (uploadError) {
        alert('圖片上傳失敗：' + uploadError.message)
        setLoading(false)
        return
      }
 
      const { data: { publicUrl } } = supabase.storage
        .from('review-images')
        .getPublicUrl(filePath)
      imageUrl = publicUrl
    }
 
    const { error } = await supabase
      .from('cafe_reviews')
      .insert({ user_id: user.id, user_name: userName, cafe_id: cafeId, content, image_url: imageUrl })
 
    if (error) {
      alert('評論送出失敗，請稍後再試')
    } else {
      setContent('')
      removeImage()
      window.location.reload()
    }
    setLoading(false)
  }
 
  return (
    <div style={{
      marginTop: 24,
      background: 'linear-gradient(145deg, #FDF8F2, #FBF5EE)',
      border: '1.5px dashed rgba(201,168,124,0.4)',
      borderRadius: 18,
      padding: '20px 20px 18px',
    }}>
      <style>{`
        .review-textarea {
          width: 100%;
          background: white;
          border: 1.5px solid rgba(201,168,124,0.25);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13px;
          color: #2C1A0E;
          line-height: 1.75;
          resize: none;
          outline: none;
          height: 88px;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Lato', sans-serif;
          box-shadow: inset 0 2px 6px rgba(44,26,14,0.04);
        }
        .review-textarea:focus {
          border-color: #C9A87C;
          box-shadow: 0 0 0 3px rgba(201,168,124,0.12), inset 0 2px 6px rgba(44,26,14,0.04);
        }
        .review-textarea::placeholder { color: #C4B5A5; }
        .submit-btn {
          width: 100%;
          background: #2C1A0E;
          color: #C9A87C;
          padding: 12px;
          border-radius: 12px;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.06em;
          transition: all 0.25s;
          box-shadow: 0 4px 14px rgba(44,26,14,0.2);
          font-family: 'Noto Serif TC', serif;
        }
        .submit-btn:hover:not(:disabled) {
          background: #3D2614;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(44,26,14,0.28);
        }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .submit-btn:disabled { background: #C4B5A5; cursor: not-allowed; box-shadow: none; }
        .upload-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 10px;
          cursor: pointer;
          background: white;
          border: 1.5px solid rgba(201,168,124,0.35);
          font-size: 12px;
          color: #7A5C3A;
          font-weight: 600;
          transition: all 0.2s;
        }
        .upload-label:hover { background: #FDF8F2; border-color: #C9A87C; }
        .remove-img-btn {
          position: absolute;
          top: 6px; right: 6px;
          background: rgba(44,26,14,0.65);
          color: white;
          border: none;
          border-radius: 50%;
          width: 22px; height: 22px;
          cursor: pointer;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .remove-img-btn:hover { background: rgba(44,26,14,0.9); }
      `}</style>
 
      {/* 標題 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 15, color: '#C9A87C' }}>✦</span>
        <h3 style={{
          fontFamily: "'Noto Serif TC', serif",
          fontSize: 14,
          fontWeight: 700,
          color: '#2C1A0E',
          letterSpacing: '0.05em',
        }}>
          留下你的心得
        </h3>
      </div>
 
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <textarea
          className="review-textarea"
          placeholder="這間咖啡廳環境如何？推薦哪款甜點？"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
 
        {/* 圖片上傳區 */}
        <div>
          {imagePreview ? (
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <img
                src={imagePreview}
                alt="preview"
                style={{
                  width: '100%',
                  maxHeight: 160,
                  objectFit: 'cover',
                  borderRadius: 10,
                  border: '1px solid rgba(201,168,124,0.3)',
                  display: 'block',
                }}
              />
              <button type="button" className="remove-img-btn" onClick={removeImage}>✕</button>
            </div>
          ) : (
            <label className="upload-label">
              📷 新增照片
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </label>
          )}
        </div>
 
        {/* 字數提示 + 送出按鈕 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 10, color: '#C9A87C', opacity: content.length > 0 ? 1 : 0, transition: 'opacity 0.3s' }}>
            {content.length} 字
          </span>
          <button type="submit" className="submit-btn" disabled={loading} style={{ flex: 1, maxWidth: 200, marginLeft: 'auto' }}>
            {loading ? '☕ 送出中...' : '送出評價 ✦'}
          </button>
        </div>
      </form>
    </div>
  )
}
 