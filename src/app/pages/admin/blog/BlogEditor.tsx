import { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  X, Save, Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Minus, ImagePlus, Link2, Undo, Redo,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { toast } from 'sonner'
import { BlogImageUpload } from './BlogImageUpload'

interface BlogPost {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_url: string | null
  author_name: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  reading_time_minutes: number | null
}

const CATEGORIES = [
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'product', label: 'Product' },
  { value: 'founder-stories', label: 'Founder Stories' },
  { value: 'growth', label: 'Growth' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'news', label: 'News' },
  { value: 'investor-insights', label: 'Investor Insights' },
]

const EMPTY_POST: BlogPost = {
  title: '', slug: '', excerpt: '', content: '',
  cover_image_url: null, author_name: 'FounderCentral Team',
  category: 'fundraising', tags: [], status: 'draft',
  published_at: null, reading_time_minutes: null,
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

function computeReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = text.split(' ').filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

interface BlogEditorProps {
  post: BlogPost | null       // null = new post
  onClose: () => void
  onSaved: () => void
}

export function BlogEditor({ post, onClose, onSaved }: BlogEditorProps) {
  const [form, setForm] = useState<BlogPost>(post ?? { ...EMPTY_POST })
  const [slugManual, setSlugManual] = useState(!!post?.slug)
  const [saving, setSaving] = useState(false)
  const [tagsInput, setTagsInput] = useState((post?.tags ?? []).join(', '))

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Start writing your blog post...' }),
    ],
    content: form.content || '',
    onUpdate: ({ editor }) => {
      setForm(f => ({ ...f, content: editor.getHTML() }))
    },
  })

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual && form.title) {
      setForm(f => ({ ...f, slug: slugify(f.title) }))
    }
  }, [form.title, slugManual])

  const handleInsertImage = useCallback(async () => {
    const url = window.prompt('Image URL (paste a public URL or upload to blog-images bucket first):')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const handleSetLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href
    const url = window.prompt('Link URL:', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }, [editor])

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.slug.trim()) { toast.error('Slug is required'); return }
    if (!form.content.trim() || form.content === '<p></p>') { toast.error('Content is required'); return }

    setSaving(true)

    const reading_time_minutes = computeReadingTime(form.content)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

    // Set published_at when publishing for the first time
    let published_at = form.published_at
    if (form.status === 'published' && !published_at) {
      published_at = new Date().toISOString()
    }

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || form.title.trim(),
      content: form.content,
      cover_image_url: form.cover_image_url,
      author_name: form.author_name.trim() || 'FounderCentral Team',
      category: form.category,
      tags,
      status: form.status,
      published_at,
      reading_time_minutes,
    }

    let error
    if (form.id) {
      ;({ error } = await supabase.from('blog_posts').update(payload).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('blog_posts').insert(payload))
    }

    setSaving(false)

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        toast.error('A post with this slug already exists. Choose a different slug.')
      } else {
        toast.error(`Save failed: ${error.message}`)
      }
      return
    }

    toast.success(form.id ? 'Post updated' : 'Post created')
    onSaved()
  }

  if (!editor) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
      overflowY: 'auto', padding: '40px 16px',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 900,
        boxShadow: 'var(--sh-pop)', display: 'flex', flexDirection: 'column',
        maxHeight: 'calc(100vh - 80px)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            {form.id ? 'Edit Post' : 'New Post'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-2)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="How to Raise Your Seed Round"
              style={inputStyle}
            />
          </div>

          {/* Slug */}
          <div>
            <label style={labelStyle}>
              Slug *
              {!slugManual && <span style={{ fontSize: 11, color: 'var(--muted-2)', marginLeft: 8 }}>(auto-generated)</span>}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={form.slug}
                onChange={e => { setSlugManual(true); setForm(f => ({ ...f, slug: slugify(e.target.value) })) }}
                placeholder="how-to-raise-seed-round"
                style={{ ...inputStyle, flex: 1 }}
              />
              {slugManual && (
                <button type="button" onClick={() => { setSlugManual(false); setForm(f => ({ ...f, slug: slugify(f.title) })) }}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}>
                  Auto
                </button>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 4 }}>
              foundercentral.in/blog/{form.slug || '...'}
            </p>
          </div>

          {/* Excerpt */}
          <div>
            <label style={labelStyle}>Excerpt <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>(meta description, ~155 chars)</span></label>
            <textarea
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="A concise summary of the post for search engines and social sharing..."
              maxLength={200}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <p style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2, textAlign: 'right' }}>
              {form.excerpt.length}/200
            </p>
          </div>

          {/* Row: Category + Author + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={inputStyle}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Author</label>
              <input
                type="text"
                value={form.author_name}
                onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as BlogPost['status'] }))}
                style={inputStyle}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>(comma-separated)</span></label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="fundraising, seed round, pitch deck"
              style={inputStyle}
            />
          </div>

          {/* Cover Image */}
          <BlogImageUpload
            value={form.cover_image_url}
            onChange={url => setForm(f => ({ ...f, cover_image_url: url }))}
          />

          {/* Rich Text Editor */}
          <div>
            <label style={labelStyle}>Content *</label>

            {/* Toolbar */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 2, padding: 6,
              borderRadius: '10px 10px 0 0', border: '1px solid var(--line)',
              borderBottom: 'none', background: 'var(--surface-2)',
            }}>
              <ToolbarBtn icon={<Bold size={15} />} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold" />
              <ToolbarBtn icon={<Italic size={15} />} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic" />
              <ToolbarDivider />
              <ToolbarBtn icon={<Heading1 size={15} />} active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1" />
              <ToolbarBtn icon={<Heading2 size={15} />} active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2" />
              <ToolbarBtn icon={<Heading3 size={15} />} active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3" />
              <ToolbarDivider />
              <ToolbarBtn icon={<List size={15} />} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List" />
              <ToolbarBtn icon={<ListOrdered size={15} />} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List" />
              <ToolbarBtn icon={<Quote size={15} />} active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote" />
              <ToolbarBtn icon={<Code size={15} />} active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block" />
              <ToolbarBtn icon={<Minus size={15} />} active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider" />
              <ToolbarDivider />
              <ToolbarBtn icon={<Link2 size={15} />} active={editor.isActive('link')} onClick={handleSetLink} title="Link" />
              <ToolbarBtn icon={<ImagePlus size={15} />} active={false} onClick={handleInsertImage} title="Image" />
              <ToolbarDivider />
              <ToolbarBtn icon={<Undo size={15} />} active={false} onClick={() => editor.chain().focus().undo().run()} title="Undo" />
              <ToolbarBtn icon={<Redo size={15} />} active={false} onClick={() => editor.chain().focus().redo().run()} title="Redo" />
            </div>

            {/* Editor */}
            <div style={{
              border: '1px solid var(--line)',
              borderRadius: '0 0 10px 10px',
              minHeight: 300,
              background: 'var(--surface)',
            }}>
              <EditorContent
                editor={editor}
                className="blog-editor-content"
                style={{ padding: '16px 20px', minHeight: 300 }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <p style={{ fontSize: 12, color: 'var(--muted-2)' }}>
            {form.content ? `~${computeReadingTime(form.content)} min read` : ''}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--line)',
              background: 'var(--surface-2)', color: 'var(--muted)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: 'var(--blue)', color: 'white',
              fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1,
            }}>
              <Save size={14} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Toolbar Helpers ────────────────────────────────────────────────────
function ToolbarBtn({ icon, active, onClick, title }: { icon: React.ReactNode; active: boolean; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30, borderRadius: 6, border: 'none',
        background: active ? 'var(--blue-bg)' : 'transparent',
        color: active ? 'var(--blue)' : 'var(--muted)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 100ms',
      }}
    >
      {icon}
    </button>
  )
}

function ToolbarDivider() {
  return <div style={{ width: 1, height: 20, background: 'var(--line)', margin: '5px 4px' }} />
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'var(--muted)',
  display: 'block', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--line)', background: 'var(--surface-2)',
  color: 'var(--ink)', fontSize: 13, outline: 'none',
  fontFamily: 'inherit',
}
