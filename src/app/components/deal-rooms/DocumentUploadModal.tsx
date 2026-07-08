import { useState, useRef, type DragEvent } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { DOCUMENT_CATEGORIES, type DocumentCategory } from '@/app/hooks/useDealRooms'

interface Props {
  open: boolean
  onClose: () => void
  onUpload: (category: DocumentCategory, file: File) => Promise<any>
}

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

export function DocumentUploadModal({ open, onClose, onUpload }: Props) {
  const [category, setCategory] = useState<DocumentCategory>('other')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setCategory('other')
    setError(null)
  }

  const validateFile = (f: File): boolean => {
    if (f.size > MAX_FILE_SIZE) {
      setError('File must be under 25 MB')
      return false
    }
    setError(null)
    return true
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files?.length) return
    const f = files[0]
    if (validateFile(f)) setFile(f)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    await onUpload(category, file)
    setUploading(false)
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Upload Document"
      subtitle="Share a document with deal room members"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => { reset(); onClose() }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={uploading}
            onClick={handleSubmit}
            disabled={!file}
          >
            Upload
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Category */}
        <div>
          <label
            className="block text-[11px] font-bold uppercase tracking-wider mb-2"
            style={{ color: 'var(--muted-2)' }}
          >
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {DOCUMENT_CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className="px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer active:scale-[0.97]"
                style={{
                  background: category === c.key ? 'var(--blue)' : 'var(--surface-2)',
                  color: category === c.key ? '#fff' : 'var(--muted)',
                  border: `1.5px solid ${category === c.key ? 'var(--blue)' : 'var(--line)'}`,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
          style={{
            borderColor: dragOver ? 'var(--blue)' : 'var(--line)',
            background: dragOver ? 'color-mix(in srgb, var(--blue) 6%, transparent)' : 'var(--surface-2)',
          }}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-5 h-5" style={{ color: 'var(--blue)' }} />
              <div className="text-left">
                <p className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
                  {file.name}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setFile(null) }}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-soft)]"
              >
                <X className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
              <p className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
                Drop a file here or click to browse
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--muted-2)' }}>
                PDF, DOCX, XLSX, PPTX, images &middot; Max 25 MB
              </p>
            </>
          )}
        </div>

        {error && (
          <p className="text-[12px] font-medium" style={{ color: 'var(--neg)' }}>
            {error}
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={e => handleFileSelect(e.target.files)}
        />
      </div>
    </Modal>
  )
}
