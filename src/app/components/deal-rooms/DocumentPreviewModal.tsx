import { X, Download, ExternalLink, Shield } from 'lucide-react'
import { WatermarkOverlay } from './WatermarkOverlay'
import { Button } from '@/app/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  url: string | null
  fileName: string
  mimeType: string | null
  onDownload: () => void
  watermarkedUrl?: string | null
}

export function DocumentPreviewModal({ open, onClose, url, fileName, mimeType, onDownload, watermarkedUrl }: Props) {
  if (!open || !url) return null

  const isPdf = mimeType?.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')
  const isImage = mimeType?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fileName)
  // Use watermarked PDF if available, fall back to raw URL
  const pdfDisplayUrl = isPdf && watermarkedUrl ? watermarkedUrl : url

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] h-[85vh] max-w-5xl rounded-[var(--r-lg)] flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
            {fileName}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" iconLeft={Download} onClick={onDownload}>
              Download
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[var(--r-sm)] cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
              style={{ color: 'var(--muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content with watermark */}
        <div className="flex-1 relative" style={{ minHeight: 0 }}>
          {isPdf ? (
            <>
              <iframe
                src={`${pdfDisplayUrl}#toolbar=0`}
                className="absolute inset-0 w-full h-full"
                style={{ border: 'none' }}
                title={fileName}
              />
              {watermarkedUrl && (
                <div
                  className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold pointer-events-none"
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', zIndex: 20 }}
                >
                  <Shield className="w-3 h-3" />
                  Server-side watermark applied
                </div>
              )}
            </>
          ) : isImage ? (
            <>
              <div className="flex items-center justify-center h-full p-8 overflow-auto">
                <img
                  src={url}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain"
                  style={{ userSelect: 'none' }}
                  onContextMenu={e => e.preventDefault()}
                />
              </div>
              <WatermarkOverlay />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
                Preview not available for this file type.
              </p>
              <Button variant="primary" size="sm" iconLeft={ExternalLink} onClick={() => window.open(url, '_blank')}>
                Open in New Tab
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
