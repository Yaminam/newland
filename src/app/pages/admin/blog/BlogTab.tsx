import { useCallback, useEffect, useState } from 'react'
import { Search, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { BlogEditor } from './BlogEditor'

interface BlogPost {
  id: string
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
  created_at: string
  updated_at: string
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  draft:     { bg: 'rgba(148,163,184,0.15)', fg: 'var(--muted-2)' },
  published: { bg: 'rgba(22,163,74,0.12)',   fg: 'var(--pos)' },
  archived:  { bg: 'rgba(234,88,12,0.12)',   fg: '#EA580C' },
}

export function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<BlogPost | null | 'new'>(null) // null=closed, 'new'=new post, BlogPost=edit

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200)

    if (error) {
      toast.error(error.message)
    } else {
      setPosts((data ?? []) as BlogPost[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  async function togglePublish(post: BlogPost) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const update: Record<string, unknown> = { status: newStatus }

    // Set published_at when publishing for the first time
    if (newStatus === 'published' && !post.published_at) {
      update.published_at = new Date().toISOString()
    }

    const { error } = await supabase.from('blog_posts').update(update).eq('id', post.id)
    if (error) { toast.error(error.message); return }
    toast.success(newStatus === 'published' ? 'Post published' : 'Post unpublished')
    fetchPosts()
  }

  async function deletePost(post: BlogPost) {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', post.id)
    if (error) { toast.error(error.message); return }
    toast.success('Post deleted')
    fetchPosts()
  }

  const filtered = posts.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.title.toLowerCase().includes(q)
      || (p.category ?? '').toLowerCase().includes(q)
      || p.status.includes(q)
      || p.author_name.toLowerCase().includes(q)
  })

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 400,
          padding: '8px 12px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--surface-2)',
        }}>
          <Search size={14} style={{ color: 'var(--muted-2)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit',
            }}
          />
        </div>

        <button
          onClick={() => setEditing('new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: 'var(--blue)', color: 'white',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> New Post
        </button>
      </div>

      {/* Table */}
      <div style={{
        border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden',
        background: 'var(--surface)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
              <th style={thStyle}>Title</th>
              <th style={{ ...thStyle, width: 120 }}>Category</th>
              <th style={{ ...thStyle, width: 100 }}>Status</th>
              <th style={{ ...thStyle, width: 130 }}>Published</th>
              <th style={{ ...thStyle, width: 60 }}>Read</th>
              <th style={{ ...thStyle, width: 120, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--muted-2)' }}>Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--muted-2)' }}>
                  {posts.length === 0 ? 'No blog posts yet. Create your first one!' : 'No posts match your search.'}
                </td>
              </tr>
            ) : filtered.map(post => {
              const sc = STATUS_COLORS[post.status] ?? STATUS_COLORS.draft
              return (
                <tr key={post.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={tdStyle}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{post.title}</span>
                      <p style={{ fontSize: 11, color: 'var(--muted-2)', margin: '2px 0 0' }}>
                        /blog/{post.slug}
                      </p>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {post.category && (
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: 'var(--surface-2)', color: 'var(--muted)',
                        textTransform: 'capitalize',
                      }}>
                        {post.category.replace(/-/g, ' ')}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: sc.bg, color: sc.fg, textTransform: 'capitalize',
                    }}>
                      {post.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--muted-2)', fontSize: 12 }}>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--muted-2)', fontSize: 12 }}>
                    {post.reading_time_minutes ? `${post.reading_time_minutes}m` : '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <ActionBtn icon={<Pencil size={13} />} title="Edit" onClick={() => setEditing(post)} />
                      <ActionBtn
                        icon={post.status === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                        title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                        onClick={() => togglePublish(post)}
                      />
                      <ActionBtn icon={<Trash2 size={13} />} title="Delete" onClick={() => deletePost(post)} danger />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {editing !== null && (
        <BlogEditor
          post={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchPosts() }}
        />
      )}
    </>
  )
}

// ─── Table Helpers ──────────────────────────────────────────────────────
function ActionBtn({ icon, title, onClick, danger }: { icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        width: 28, height: 28, borderRadius: 6, border: 'none',
        background: 'var(--surface-2)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? 'var(--neg)' : 'var(--muted)',
        transition: 'background 100ms',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(220,38,38,0.1)' : 'var(--line)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
    >
      {icon}
    </button>
  )
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: 0.5,
}

const tdStyle: React.CSSProperties = {
  padding: '12px 14px', verticalAlign: 'middle',
}
