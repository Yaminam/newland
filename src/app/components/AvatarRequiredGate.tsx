import { useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from './ui/Modal'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { normalizeAvatarUrl } from '../lib/avatarUrl'
import { validateUploadedFile } from '../lib/inputSecurity'

// Shown to any fully-onboarded user whose profile row has no avatar_url.
// Mounted from DashboardLayout so it blankets every authenticated page.
// Dismissible — the user can skip and update their avatar later in Settings.
export function AvatarRequiredGate() {
  const { user, profile, onboardingCompleted, refreshProfile } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const hasAvatar = Boolean(normalizeAvatarUrl(profile?.avatar_url))
  const open = Boolean(user && profile && onboardingCompleted && !hasAvatar && !dismissed)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      validateUploadedFile(f, {
        maxBytes: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      })
      setFile(f)
      setPreview(URL.createObjectURL(f))
    } catch (err) {
      toast.error((err as Error).message || 'Invalid image')
      e.target.value = ''
    }
  }

  async function handleUpload() {
    if (!file || !user) return
    setUploading(true)
    try {
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
      }
      const ext = mimeToExt[file.type] ?? file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const avatarPath = `${user.id}/avatar.${ext}`
      // Remove any existing avatar first — only INSERT policy is guaranteed on all envs.
      await supabase.storage.from('avatars').remove([avatarPath])
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(avatarPath, file, { contentType: file.type })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(avatarPath)
      const bustedUrl = `${publicUrl}?t=${Date.now()}`
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: bustedUrl })
        .eq('id', user.id)
      if (updErr) throw updErr
      await refreshProfile()
      toast.success('Profile picture saved')
    } catch (err) {
      toast.error(`Upload failed: ${(err as Error).message ?? 'unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open
      onClose={() => setDismissed(true)}
      size="sm"
      title="Add a profile picture"
      subtitle="A real photo helps investors and founders recognize you on FounderCentral."
      footer={
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDismissed(true)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{ color: 'var(--muted)', background: 'var(--surface-2)', border: '1px solid var(--line)' }}
          >
            Skip for now
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-60 hover:brightness-110"
            style={{ background: 'var(--blue)', boxShadow: 'var(--shadow-glow-blue)' }}
          >
            {uploading ? 'Uploading…' : 'Save photo'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5 py-2">
        <div
          className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
          style={{ background: 'var(--surface-2)', border: '1px dashed var(--line)' }}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-8 h-8" style={{ color: 'var(--muted-2)' }} />
          )}
        </div>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-black/[0.03]"
            style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}
          >
            <Upload className="w-4 h-4" />
            {file ? 'Choose different photo' : 'Pick a photo'}
          </span>
        </label>
        <p className="text-[11px] text-center" style={{ color: 'var(--muted-2)' }}>
          JPG, PNG, or WebP. Max 5 MB.
        </p>
      </div>
    </Modal>
  )
}
