import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { toast } from 'sonner'

interface BlogImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
}

export function BlogImageUpload({ value, onChange, label = 'Cover Image' }: BlogImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
      .from('blog-images')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (error) {
      toast.error(`Upload failed: ${error.message}`)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(path)

    onChange(urlData.publicUrl)
    setUploading(false)
    toast.success('Image uploaded')

    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
        {label}
      </label>

      {value ? (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)' }}>
          <img src={value} alt="Cover" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(0,0,0,0.6)', color: 'white',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%', height: 100, borderRadius: 10,
            border: '2px dashed var(--line)',
            background: 'var(--surface-2)', color: 'var(--muted-2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            cursor: uploading ? 'wait' : 'pointer', fontSize: 13,
          }}
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
          {uploading ? 'Uploading...' : 'Click to upload'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
}
