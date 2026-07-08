import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { DD_CATEGORIES, type DDCategory } from '@/app/hooks/useDDChecklists'

interface Props {
  onAdd: (title: string, category: DDCategory, description?: string, dueDate?: string) => void
}

export function DDAddItemForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<DDCategory>('other')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    onAdd(title.trim(), category, description.trim() || undefined, dueDate || undefined)
    setTitle('')
    setDescription('')
    setDueDate('')
    setCategory('other')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 w-full text-[13px] font-medium cursor-pointer transition-colors hover:bg-[var(--bg-soft)]"
        style={{ color: 'var(--blue)' }}
      >
        <Plus className="w-4 h-4" />
        Add item
      </button>
    )
  }

  return (
    <div className="px-4 py-3 border-t border-[var(--line-light)]" style={{ background: 'var(--bg-soft)' }}>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Item title..."
        autoFocus
        className="w-full text-[13px] font-medium p-2 rounded-[var(--r-md)] border border-[var(--line)] mb-2 focus:outline-none focus:border-[var(--blue)]"
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
      />

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {DD_CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className="text-[10px] font-semibold px-2 py-1 rounded-full cursor-pointer transition-colors"
            style={{
              background: category === c.value ? `${c.color}20` : 'var(--bg)',
              color: category === c.value ? c.color : 'var(--muted)',
              border: `1px solid ${category === c.value ? c.color : 'var(--line)'}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="flex-1 text-[12px] p-2 rounded-[var(--r-md)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)]"
          style={{ background: 'var(--bg)', color: 'var(--ink)' }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="text-[12px] p-2 rounded-[var(--r-md)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)]"
          style={{ background: 'var(--bg)', color: 'var(--ink)' }}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!title.trim()}>
          Add
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
