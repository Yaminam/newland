// -- ALTER TABLE public.profiles
// --   ADD COLUMN IF NOT EXISTS appearance_preferences JSONB DEFAULT '{}';

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import {
  User, Lock, Bell, Shield, Palette, Link2, CreditCard,
  LogOut, Camera, CheckCircle, XCircle, AlertTriangle, ChevronRight,
  Settings, Building2, Search, Loader2, Send, Clock,
} from 'lucide-react'
import { PageHeader } from '@/app/components/ui/PageHeader'
import { Modal } from '@/app/components/ui/Modal'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { sanitizeOptionalText, sanitizeText, validateUploadedFile, validateFileSignature } from '@/app/lib/inputSecurity'
import { PASSWORD_REQUIRED_MESSAGE, getPasswordPolicyError } from '@/app/lib/validation'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────
interface ProfileData {
  id: string
  email: string
  first_name: string
  last_name: string
  company?: string
  bio?: string
  role: 'investor' | 'founder'
  avatar_url?: string
  notification_preferences?: NotificationPrefs
  privacy_settings?: PrivacySettings
}

interface NotificationPrefs {
  app_intro_requests: boolean
  email_intro_notifications: boolean
}

interface PrivacySettings {
  show_profile: boolean
  allow_intro_requests: boolean
  show_in_search: boolean
}

const DEFAULT_NOTIF: NotificationPrefs = {
  app_intro_requests: true,
  email_intro_notifications: true,
}

const DEFAULT_PRIVACY: PrivacySettings = {
  show_profile: true,
  allow_intro_requests: true,
  show_in_search: true,
}

const ALL_SECTIONS = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'account' as const, label: 'Account', icon: Lock },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'privacy' as const, label: 'Privacy', icon: Shield },
  { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  { id: 'incubation' as const, label: 'Incubation', icon: Building2 },
  { id: 'billing' as const, label: 'Billing', icon: CreditCard },
]

type SectionId = typeof ALL_SECTIONS[number]['id']

function getVisibleSections(role?: string, incubationId?: string | null) {
  return ALL_SECTIONS
    .filter(s => {
      if (s.id === 'billing') return false
      // Incubation tab: only for founders not yet in an incubation
      if (s.id === 'incubation') return role === 'founder' && !incubationId
      return true
    })
}

// ─── Toggle Switch ─────────────────────────────────────────────────────
function Toggle({
  checked, onChange, label, description
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--muted-2)' }}>{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative rounded-full transition-all flex-shrink-0"
        style={{
          width: 44,
          height: 24,
          background: checked ? 'var(--blue)' : 'var(--faint)',
          transition: 'background 200ms ease',
        }}
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
          style={{
            left: checked ? '1.5rem' : '0.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            transition: 'left 200ms ease',
          }}
        />
      </button>
    </div>
  )
}

// ─── Nav item ─────────────────────────────────────────────────────────
function NavItem({
  icon: Icon, label, active, onClick
}: {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all relative overflow-hidden"
      style={active
        ? {
            background: 'var(--blue-bg)',
            color: 'var(--blue-h)',
            paddingLeft: 16,
            paddingRight: 12,
            fontWeight: 500,
          }
        : {
            color: 'var(--muted)',
            paddingLeft: 16,
            paddingRight: 12,
          }
      }
    >
      {active && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: '20%',
            bottom: '20%',
            width: 3,
            borderRadius: '0 3px 3px 0',
            background: 'var(--blue)',
          }}
        />
      )}
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  )
}

// ─── Section divider ───────────────────────────────────────────────────
function Divider() {
  return <div className="my-2" style={{ borderBottom: '1px solid var(--line)' }} />
}

// ─── Input field ──────────────────────────────────────────────────────
function Field({
  label, value, onChange, type = 'text', placeholder, disabled = false, rows
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
  rows?: number
}) {
  const base: React.CSSProperties = {
    background: disabled ? 'var(--bg)' : 'var(--surface)',
    
    color: disabled ? 'var(--muted-2)' : 'var(--ink)',
    borderRadius: 8,
    padding: '0.625rem 0.875rem',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    opacity: disabled ? 0.8 : 1,
    fontFamily: 'var(--font-body)',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: 'var(--muted-2)' }}>{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          style={{ ...base, resize: 'vertical' }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={base}
        />
      )}
    </div>
  )
}

// ─── Profile Section ──────────────────────────────────────────────────
function ProfileSection({ profileData, onSaved }: { profileData: ProfileData; onSaved: (p: ProfileData) => void }) {
  const { refreshProfile } = useAuth()
  const [firstName, setFirstName] = useState(profileData.first_name ?? '')
  const [lastName, setLastName] = useState(profileData.last_name ?? '')
  const [company, setCompany] = useState(profileData.company ?? '')
  const [bio, setBio] = useState(profileData.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profileData.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadAvatar(file: File) {
    try {
      validateUploadedFile(file, {
        maxBytes: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      })
      await validateFileSignature(file)

      setUploading(true)
      const ext = file.type === 'image/jpeg' ? 'jpg' : file.name.split('.').pop()?.toLowerCase()
      const path = `${profileData.id}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadErr) {
        toast.error(`Avatar upload failed: ${uploadErr.message}`)
        setUploading(false)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      // Cache-bust so the sidebar/topbar pick up the new image even when
      // the path (and therefore publicUrl) hasn't changed between uploads.
      const bustedUrl = `${data.publicUrl}?t=${Date.now()}`
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: bustedUrl })
        .eq('id', profileData.id)
      if (updateErr) { toast.error('Failed to save avatar'); setUploading(false); return }
      setAvatarUrl(bustedUrl)
      onSaved({ ...profileData, avatar_url: bustedUrl })
      await refreshProfile()
      setUploading(false)
      toast.success('Avatar updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Avatar upload failed')
      setUploading(false)
    }
  }

  async function removeAvatar() {
    setUploading(true)
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', profileData.id)
    if (updateErr) { toast.error('Failed to remove avatar'); setUploading(false); return }
    setAvatarUrl('')
    onSaved({ ...profileData, avatar_url: undefined })
    await refreshProfile()
    setUploading(false)
    toast.success('Avatar removed')
  }

  async function saveProfile() {
    setSaving(true)
    try {
      const sanitizedFirstName = sanitizeText(firstName, { maxLength: 100, allowEmpty: false })
      const sanitizedLastName = sanitizeText(lastName, { maxLength: 100, allowEmpty: false })
      const sanitizedCompany = sanitizeOptionalText(company, { maxLength: 160 })
      const sanitizedBio = sanitizeOptionalText(bio, { maxLength: 2000, multiline: true })
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          company: sanitizedCompany,
          bio: sanitizedBio,
          avatar_url: avatarUrl,
        })
        .eq('id', profileData.id)

      if (error) {
        toast.error('Failed to save profile')
      } else {
        toast.success('Profile saved')
        onSaved({
          ...profileData,
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          company: sanitizedCompany,
          bio: sanitizedBio,
          avatar_url: avatarUrl,
        })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>Profile</h3>
        <p className="text-sm" style={{ color: 'var(--muted-2)' }}>Manage your public profile information</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--surface-2)', border: '2px solid var(--line)' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8" style={{ color: 'var(--muted-2)' }} />
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'var(--blue)' }}
          >
            <Camera className="w-3.5 h-3.5 text-white" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }}
          />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {firstName} {lastName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-2)' }}>
            {uploading ? 'Uploading…' : 'JPG, PNG or WebP. Max 2MB.'}
          </p>
          {avatarUrl && (
            <button
              onClick={removeAvatar}
              disabled={uploading}
              className="mt-2 text-xs font-medium transition-colors"
              style={{ color: 'var(--neg)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="Jane" />
        <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" />
        <Field label="Company" value={company} onChange={setCompany} placeholder="Acme Ventures" />
        <Field label="Role" value={profileData.role} disabled />
      </div>

      <Field
        label="Bio"
        value={bio}
        onChange={setBio}
        placeholder="Tell investors / founders about yourself…"
        rows={3}
      />

      <button
        onClick={saveProfile}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
        style={{ background: 'var(--blue)', color: 'var(--surface)', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Saving…' : 'Save Profile'}
      </button>
    </div>
  )
}

// ─── Account Section ──────────────────────────────────────────────────
function AccountSection({ profileData }: { profileData: ProfileData }) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  async function changePassword() {
    const passwordError = getPasswordPolicyError(newPw)
    if (passwordError) { toast.error(passwordError); return }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    if (!currentPw) { toast.error('Enter your current password'); return }

    setPwLoading(true)
    // Re-authenticate to verify the current password before allowing the change
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: profileData.email,
      password: currentPw,
    })
    if (reAuthError) {
      toast.error('Current password is incorrect')
      setPwLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      toast.error('Failed to update password')
    } else {
      // Fire security-alert email (fire-and-forget — never blocks UI).
      void supabase.functions.invoke('notify-self', {
        body: { type: 'password_changed' },
      }).catch(err => console.warn('[changePassword] notify-self skipped:', err))
      toast.success('Password updated')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    }
    setPwLoading(false)
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'DELETE') { toast.error('Type DELETE to confirm'); return }
    try {
      const { error } = await supabase.functions.invoke('delete-account', { body: {} })
      if (error) {
        toast.error('Failed to delete account. Contact support.')
        console.error('[delete-account] error:', error)
        return
      }
      toast.success('Account deleted. Signing you out…')
      setShowDeleteModal(false)
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err) {
      console.error('[delete-account] unexpected error:', err)
      toast.error('Failed to delete account. Contact support.')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>Account</h3>
        <p className="text-sm" style={{ color: 'var(--muted-2)' }}>Manage credentials and account settings</p>
      </div>

      {/* Email */}
      <Field label="Email Address" value={profileData.email} disabled />

      <Divider />

      {/* Change password */}
      <div>
        <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink)' }}>Change Password</h4>
        <div className="space-y-3">
          <Field label="Current Password" value={currentPw} onChange={setCurrentPw} type="password" placeholder="••••••••" />
          <Field label="New Password" value={newPw} onChange={setNewPw} type="password" placeholder="••••••••" />
          <Field label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="••••••••" />
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          {PASSWORD_REQUIRED_MESSAGE}
        </p>
        <button
          onClick={changePassword}
          disabled={pwLoading}
          className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
          style={{ background: 'var(--blue)', color: 'var(--surface)', opacity: pwLoading ? 0.7 : 1 }}
        >
          {pwLoading ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      <Divider />

      {/* Danger zone */}
      <div className="danger-zone">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4" style={{ color: 'var(--neg)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--neg)' }}>Danger Zone</h4>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
          Once you delete your account, there is no going back. This action is permanent.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--neg)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          Delete Account
        </button>
      </div>

      {/* Delete confirm modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
        title="Delete Account"
        subtitle="This action cannot be undone."
        size="md"
        footer={
          <>
            <button
              onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--line)' }}
            >
              Cancel
            </button>
            <button
              onClick={deleteAccount}
              disabled={deleteConfirm !== 'DELETE'}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-opacity"
              style={{ background: 'var(--neg)', color: 'white', opacity: deleteConfirm === 'DELETE' ? 1 : 0.4 }}
            >
              Delete Account
            </button>
          </>
        }
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--neg-bg)' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--neg)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Type <strong style={{ color: 'var(--neg)' }}>DELETE</strong> to confirm you want to permanently remove this account.
          </p>
        </div>
        <input
          type="text"
          value={deleteConfirm}
          onChange={e => setDeleteConfirm(e.target.value)}
          placeholder="Type DELETE"
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-0"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
        />
      </Modal>
    </div>
  )
}

// ─── Notifications Section ────────────────────────────────────────────
function NotificationsSection({ profileData }: { profileData: ProfileData }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    ...DEFAULT_NOTIF,
    ...(profileData.notification_preferences ?? {}),
  })
  const [saving, setSaving] = useState(false)

  function update(key: keyof NotificationPrefs, val: boolean) {
    setPrefs(p => ({ ...p, [key]: val }))
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: prefs })
      .eq('id', profileData.id)

    if (error) toast.error('Failed to save preferences')
    else toast.success('Notification preferences saved')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>Notifications</h3>
        <p className="text-sm" style={{ color: 'var(--muted-2)' }}>Control how and when you receive notifications</p>
      </div>

      <div className="rounded-2xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
        <div style={{ borderTop: '1px solid var(--line)' }}>
          <Toggle
            checked={prefs.app_intro_requests}
            onChange={v => update('app_intro_requests', v)}
            label="In-app & push"
            description="Show intro requests in the app bell and send a push notification" />
          <div style={{ borderTop: '1px solid var(--line)' }}>
            <Toggle
              checked={prefs.email_intro_notifications}
              onChange={v => update('email_intro_notifications', v)}
              label="Email"
              description="Email me when someone requests or responds to an intro" />
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--muted-2)' }}>
        FounderCentral is discovery-only — conversations move to email after an intro is accepted, so these two channels cover everything you need.
      </p>

      <button
        onClick={save}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
        style={{ background: 'var(--blue)', color: 'var(--surface)', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Saving…' : 'Save Preferences'}
      </button>
    </div>
  )
}

// ─── Privacy Section ──────────────────────────────────────────────────
function PrivacySection({ profileData }: { profileData: ProfileData }) {
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    ...DEFAULT_PRIVACY,
    ...(profileData.privacy_settings ?? {}),
  })
  const [saving, setSaving] = useState(false)

  function update(key: keyof PrivacySettings, val: boolean) {
    setPrivacy(p => ({ ...p, [key]: val }))
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ privacy_settings: privacy })
      .eq('id', profileData.id)

    if (error) toast.error('Failed to save privacy settings')
    else toast.success('Privacy settings saved')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>Privacy</h3>
        <p className="text-sm" style={{ color: 'var(--muted-2)' }}>Control your visibility and data sharing</p>
      </div>

      <div className="rounded-2xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
        <Toggle
          checked={privacy.show_profile}
          onChange={v => update('show_profile', v)}
          label="Show profile to investors/founders"
          description="Your profile will be visible in the matching platform"
        />
        <div style={{ borderTop: '1px solid var(--line)' }}>
          <Toggle
            checked={privacy.allow_intro_requests}
            onChange={v => update('allow_intro_requests', v)}
            label="Allow intro requests"
            description="Others can send you intro requests through the platform"
          />
        </div>
        <div style={{ borderTop: '1px solid var(--line)' }}>
          <Toggle
            checked={privacy.show_in_search}
            onChange={v => update('show_in_search', v)}
            label="Show in search results"
            description="Your profile appears in investor/founder search results"
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
        style={{ background: 'var(--blue)', color: 'var(--surface)', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Saving…' : 'Save Privacy Settings'}
      </button>
    </div>
  )
}

// ─── Appearance Section ───────────────────────────────────────────────
function AppearanceSection({ profileId }: { profileId: string }) {
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')
  const [language] = useState('English')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Set to true after initial DB load to prevent saving during hydration
  const readyRef = useRef(false)

  // Load saved preferences on mount
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('appearance_preferences')
        .eq('id', profileId)
        .maybeSingle()
      if (data?.appearance_preferences) {
        const prefs = data.appearance_preferences as {
          fontSize?: 'normal' | 'large'
          language?: string
        }
        if (prefs.fontSize) setFontSize(prefs.fontSize)
      }
      readyRef.current = true
    }
    load()
  }, [profileId])

  // Debounced save — only fires on explicit user interaction (after hydration)
  const scheduleSave = useCallback(
    (fs: 'normal' | 'large', lang: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        const { error } = await supabase
          .from('profiles')
          .update({ appearance_preferences: { fontSize: fs, language: lang } })
          .eq('id', profileId)
        if (!error) toast.success('Appearance saved')
      }, 500)
    },
    [profileId],
  )

  function handleFontSizeChange(f: 'normal' | 'large') {
    setFontSize(f)
    if (readyRef.current) scheduleSave(f, language)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>Appearance</h3>
        <p className="text-sm" style={{ color: 'var(--muted-2)' }}>Customize how FounderCentral looks for you</p>
      </div>

      {/* Language */}
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>Language</p>
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
        >
          <span className="text-sm" style={{ color: 'var(--ink)' }}>English</span>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--pos)' }}>
            Default
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Integrations Section ─────────────────────────────────────────────
function IntegrationsSection() {
  const integrations = [
    {
      name: 'LinkedIn',
      description: 'Connect to auto-fill your profile and showcase experience',
      connected: false,
      action: 'Connect LinkedIn',
    },
    {
      name: 'Pitch Deck',
      description: 'Upload and manage your pitch deck for investors',
      connected: false,
      action: 'Upload Pitch Deck',
    },
    {
      name: 'Calendar Sync',
      description: 'Sync meetings and events with your calendar',
      connected: false,
      action: 'Coming Soon',
      disabled: true,
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>Integrations</h3>
        <p className="text-sm" style={{ color: 'var(--muted-2)' }}>Connect third-party tools to enhance your experience</p>
      </div>

      <div className="space-y-3">
        {integrations.map(intg => (
          <div key={intg.name}
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: intg.connected ? 'rgba(16,185,129,0.15)' : 'var(--surface)' }}>
                {intg.connected
                  ? <CheckCircle className="w-5 h-5" style={{ color: 'var(--pos)' }} />
                  : <XCircle className="w-5 h-5" style={{ color: 'var(--muted-2)' }} />
                }
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{intg.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-2)' }}>{intg.description}</p>
              </div>
            </div>
            <button
              disabled={intg.disabled}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={intg.disabled
                ? { background: 'var(--surface)', color: 'var(--muted-2)', border: '1px solid var(--line)', opacity: 0.5, cursor: 'not-allowed' }
                : intg.connected
                  ? { background: 'rgba(239,68,68,0.15)', color: 'var(--neg)', border: '1px solid rgba(239,68,68,0.3)' }
                  : { background: 'rgba(37,99,235,0.15)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.3)' }
              }
            >
              {intg.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Billing / Add-ons Section ───────────────────────────────────────
function BillingSection({ sectionLabel = 'Billing' }: { sectionLabel?: string }) {
  const freeFeatures = [
    'Up to 5 active deals',
    'Funding tracker access',
    'Basic sector analytics',
    'Community events',
    'Intro requests (5/month)',
  ]
  const proFeatures = [
    'Unlimited deals',
    'Advanced analytics & insights',
    'Priority matching',
    'Unlimited intro requests',
    'CRM integration',
    'Dedicated support',
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>{sectionLabel}</h3>
        <p className="text-sm" style={{ color: 'var(--muted-2)' }}>Manage your subscription and {sectionLabel.toLowerCase()} details</p>
      </div>

      {/* Current plan */}
      <div className="rounded-2xl p-3"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Current Plan</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-2)' }}>Your active subscription</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.3)' }}>
            Free Plan
          </span>
        </div>
        <ul className="space-y-2">
          {freeFeatures.map(f => (
            <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--pos)' }} />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Pro upgrade */}
      <div className="rounded-2xl p-3 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(52,134,232,0.1))', border: '1px solid rgba(37,99,235,0.3)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'var(--blue)', transform: 'translate(30%, -30%)' }} />
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>FounderCentral Pro</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-2)' }}>Everything you need to scale</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(217,119,6,0.2)', color: '#d97706', border: '1px solid rgba(217,119,6,0.3)' }}>
              Coming Soon
            </span>
          </div>
          <ul className="space-y-2 mb-4">
            {proFeatures.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--blue)' }} />
                {f}
              </li>
            ))}
          </ul>
          <button
            disabled
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--blue)', color: 'var(--surface)', opacity: 0.5, cursor: 'not-allowed' }}
          >
            Upgrade to Pro — Coming Soon
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Incubation Join Section ───────────────────────────────────────────
interface IncubationSearchResult {
  id: string
  name: string
  incubation_type: string
  description: string | null
  city: string | null
  country: string | null
  sectors: string[]
  is_verified: boolean
}

interface PendingRequest {
  id: string
  incubation_id: string
  created_at: string
  incubation_profiles: { name: string; incubation_type: string; city: string | null } | null
}

function IncubationJoinSection({ founderId }: { founderId: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<IncubationSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

  // Load existing pending requests on mount
  useEffect(() => {
    supabase
      .from('incubation_join_requests')
      .select('id, incubation_id, created_at, incubation_profiles(name, incubation_type, city)')
      .eq('founder_id', founderId)
      .eq('status', 'pending')
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as PendingRequest[]
        setPendingRequests(rows)
        setSentIds(new Set(rows.map(r => r.incubation_id)))
      })
  }, [founderId])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('incubation_profiles')
      .select('id, name, incubation_type, description, city, country, sectors, is_verified')
      .ilike('name', `%${q.trim()}%`)
      .eq('is_verified', true)
      .limit(8)
    setResults((data ?? []) as IncubationSearchResult[])
    setSearching(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 350)
    return () => clearTimeout(t)
  }, [query, search])

  const sendRequest = async (incubationId: string) => {
    setRequestingId(incubationId)
    const { data, error } = await supabase
      .from('incubation_join_requests')
      .insert({ incubation_id: incubationId, founder_id: founderId, message: message.trim() || null })
      .select('id, incubation_id, created_at, incubation_profiles(name, incubation_type, city)')
      .single()
    setRequestingId(null)
    if (error) {
      if (error.code === '23505') toast.error('You already sent a request to this program')
      else toast.error(error.message)
      return
    }
    setSentIds(s => new Set([...s, incubationId]))
    setPendingRequests(p => [...p, data as unknown as PendingRequest])
    setMessage('')
    toast.success('Request sent — the program admin will review it.')
  }

  const withdrawRequest = async (requestId: string, incubationId: string) => {
    setWithdrawingId(requestId)
    const { error } = await supabase
      .from('incubation_join_requests')
      .delete()
      .eq('id', requestId)
    setWithdrawingId(null)
    if (error) { toast.error('Failed to withdraw request'); return }
    setPendingRequests(p => p.filter(r => r.id !== requestId))
    setSentIds(s => { const n = new Set(s); n.delete(incubationId); return n })
    toast.success('Request withdrawn.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold mb-1" style={{ color: 'var(--ink)' }}>Join an Incubation Program</h3>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Search for an accelerator or incubator on the platform and send a join request. The admin will review and approve or decline.
        </p>
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-2)' }}>
            Pending requests
          </p>
          {pendingRequests.map(req => (
            <div key={req.id}
              className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-[14px] font-black"
                style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>
                {req.incubation_profiles?.name?.[0] ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                  {req.incubation_profiles?.name ?? 'Incubation Program'}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-2)' }}>
                  {[req.incubation_profiles?.incubation_type?.replace(/_/g, ' '), req.incubation_profiles?.city].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                style={{ background: 'rgba(245,158,11,0.10)', color: '#D97706' }}>
                <Clock className="w-2.5 h-2.5" /> Pending
              </span>
              <button
                onClick={() => withdrawRequest(req.id, req.incubation_id)}
                disabled={withdrawingId === req.id}
                className="text-xs font-medium px-2.5 py-1 rounded-lg shrink-0 transition-opacity"
                style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--neg)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                {withdrawingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Withdraw'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-2)' }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search programs by name…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: 'var(--muted-2)' }} />}
      </div>

      {/* Optional message */}
      {query && results.length > 0 && (
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--muted)' }}>
            Message to program admin <span style={{ color: 'var(--muted-2)' }}>(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Tell them about your startup…"
            rows={3}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
          />
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.10)' }}>
                <Building2 className="w-5 h-5" style={{ color: '#7C3AED' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{r.name}</span>
                  {r.is_verified && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--pos)' }}>Verified</span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--line)' }}>{r.incubation_type}</span>
                </div>
                {(r.city || r.country) && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-2)' }}>{[r.city, r.country].filter(Boolean).join(', ')}</p>
                )}
              </div>
              {sentIds.has(r.id) ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.10)', color: '#D97706' }}>
                  <Clock className="w-3.5 h-3.5" /> Pending
                </span>
              ) : (
                <button
                  onClick={() => sendRequest(r.id)}
                  disabled={requestingId === r.id}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white shrink-0"
                  style={{ background: '#7C3AED' }}
                >
                  {requestingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Request
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {query && !searching && results.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: 'var(--muted-2)' }}>No programs found for "{query}"</p>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────
export function SettingsPage() {
  const { profile, logout } = useAuth()
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  const visibleSections = getVisibleSections(profile?.role, profile?.incubation_id)
  const billingLabel = profile?.role === 'founder' ? 'Add-ons' : 'Billing'

  useEffect(() => {
    async function fetchProfile() {
      if (!profile?.id) return
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .maybeSingle()

      if (error) {
        toast.error('Failed to load profile')
      } else {
        setProfileData(data as ProfileData)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [profile?.id])

  function renderSection() {
    if (loading || !profileData) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} height={48} className="rounded-xl" />
          ))}
        </div>
      )
    }

    switch (activeSection) {
      case 'profile': return <ProfileSection profileData={profileData} onSaved={setProfileData} />
      case 'account': return <AccountSection profileData={profileData} />
      case 'notifications': return <NotificationsSection profileData={profileData} />
      case 'privacy': return <PrivacySection profileData={profileData} />
      case 'appearance': return <AppearanceSection profileId={profileData.id} />
      case 'billing': return <BillingSection sectionLabel={billingLabel} />
      case 'incubation': return <IncubationJoinSection founderId={profileData.id} />
      default: return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-4 space-y-3">
      <SEO title="Settings" path="/dashboard/settings" noindex />
      <PageHeader
        title="Settings"
        subtitle="Manage your account, notifications, and preferences"
        icon={<Settings className="w-5 h-5" />}
      />

      <div className="flex flex-col lg:flex-row gap-3">
        {/* Sidebar nav */}
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:w-56 flex-shrink-0"
        >
          <div className="card rounded-2xl p-3 space-y-1">
            {visibleSections.map(s => (
              <NavItem
                key={s.id}
                icon={s.icon}
                label={s.label}
                active={activeSection === s.id}
                onClick={() => {
                  // If current active section is hidden for this role, reset to profile
                  setActiveSection(s.id)
                }}
              />
            ))}

            <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--line)' }}>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ color: 'var(--neg)', border: '1px solid transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </motion.aside>

        {/* Content panel */}
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 min-w-0"
        >
          <div className="card rounded-2xl p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </div>
  )
}
