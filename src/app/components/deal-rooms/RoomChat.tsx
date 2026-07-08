import { useState, useRef, useEffect } from 'react'
import { Send, X } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import { usePresence } from '@/app/hooks/usePresence'
import type { DealRoomMessage } from '@/app/hooks/useDealRooms'

interface Props {
  messages: DealRoomMessage[]
  roomId: string
  onSend: (roomId: string, body: string, threadId?: string) => Promise<DealRoomMessage | null>
}

export function RoomChat({ messages, roomId, onSend }: Props) {
  const { user } = useAuth()
  const { onlineUsers, setTyping } = usePresence(roomId)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<DealRoomMessage | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async () => {
    if (!body.trim() || sending) return
    setSending(true)
    const msg = body
    const threadId = replyTo?.id
    setBody('')
    setReplyTo(null)
    await onSend(roomId, msg, threadId)
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by date
  const grouped: { date: string; messages: DealRoomMessage[] }[] = []
  for (const msg of messages) {
    const date = new Date(msg.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const last = grouped[grouped.length - 1]
    if (last?.date === date) {
      last.messages.push(msg)
    } else {
      grouped.push({ date, messages: [msg] })
    }
  }

  const typingUsers = onlineUsers.filter(u => u.isTyping)

  return (
    <div className="flex flex-col" style={{ height: '400px' }}>
      {/* Online indicators */}
      {onlineUsers.length > 0 && (
        <div className="flex items-center gap-2 pb-2 mb-1" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex -space-x-1.5">
            {onlineUsers.slice(0, 5).map(u => (
              <div
                key={u.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-[var(--surface)]"
                style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}
                title={u.name}
              >
                {u.name[0]?.toUpperCase() ?? '?'}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-medium" style={{ color: 'var(--pos)' }}>
            {onlineUsers.length} online
          </span>
        </div>
      )}

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-1 py-2 space-y-1"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>
              No messages yet. Start the conversation.
            </p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
                <span className="text-[10px] font-medium shrink-0" style={{ color: 'var(--muted-2)' }}>
                  {group.date}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
              </div>

              {group.messages.map(msg => {
                const isMe = msg.user_id === user?.id
                const parentMsg = msg.thread_id
                  ? messages.find(m => m.id === msg.thread_id)
                  : null
                return (
                  <div
                    key={msg.id}
                    className={`group flex gap-2 mb-2 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    {!isMe && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold self-end"
                        style={{
                          background: 'var(--blue-bg)',
                          color: 'var(--blue)',
                        }}
                      >
                        {(msg.user?.full_name ?? '?')[0].toUpperCase()}
                      </div>
                    )}

                    {/* Bubble + reply button */}
                    <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* In-reply-to label */}
                      {parentMsg && (
                        <p
                          className="text-[10px] mb-0.5 px-1 italic truncate max-w-full"
                          style={{ color: 'var(--muted-2)' }}
                        >
                          In reply to {parentMsg.user?.full_name ?? 'Unknown'}: {parentMsg.body.slice(0, 40)}{parentMsg.body.length > 40 ? '…' : ''}
                        </p>
                      )}
                      <div className={`flex items-end gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <div
                          className="rounded-2xl px-3.5 py-2"
                          style={{
                            background: isMe ? 'var(--blue)' : 'var(--surface-2)',
                            color: isMe ? '#fff' : 'var(--ink)',
                            borderBottomRightRadius: isMe ? '6px' : undefined,
                            borderBottomLeftRadius: !isMe ? '6px' : undefined,
                          }}
                        >
                          {!isMe && (
                            <p
                              className="text-[10px] font-semibold mb-0.5"
                              style={{ color: 'var(--blue)' }}
                            >
                              {msg.user?.full_name ?? 'Unknown'}
                            </p>
                          )}
                          <p className="text-[13px] whitespace-pre-wrap break-words">{msg.body}</p>
                          <p
                            className="text-[9px] mt-1 text-right"
                            style={{ opacity: 0.6 }}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {/* Reply button — visible on hover */}
                        <button
                          onClick={() => { setReplyTo(msg); inputRef.current?.focus() }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0 mb-1"
                          style={{ color: 'var(--muted)', background: 'var(--surface-2)', border: '1px solid var(--line)' }}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-1 py-1">
          <span className="text-[10px] font-medium animate-pulse" style={{ color: 'var(--muted)' }}>
            {typingUsers.map(u => u.name.split(' ')[0]).join(', ')}{' '}
            {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      {/* Reply-to bar */}
      {replyTo && (
        <div
          className="flex items-center gap-2 px-2 py-1.5 mb-1 rounded-lg text-[11px]"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
        >
          <span style={{ color: 'var(--muted-2)' }} className="flex-1 truncate">
            Replying to <span className="font-semibold" style={{ color: 'var(--blue)' }}>{replyTo.user?.full_name ?? 'Unknown'}</span>: {replyTo.body.slice(0, 60)}{replyTo.body.length > 60 ? '…' : ''}
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="shrink-0 p-0.5 rounded"
            style={{ color: 'var(--muted-2)' }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div
        className="flex items-end gap-2 pt-3 border-t"
        style={{ borderColor: 'var(--line)' }}
      >
        <textarea
          ref={inputRef}
          value={body}
          onChange={e => { setBody(e.target.value.slice(0, 2000)); setTyping(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 text-[13px] px-3 py-2 rounded-xl border resize-none focus:outline-none focus:border-[var(--blue)]"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            maxHeight: '80px',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!body.trim() || sending}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity"
          style={{
            background: 'var(--blue)',
            color: '#fff',
            opacity: !body.trim() || sending ? 0.5 : 1,
            cursor: !body.trim() || sending ? 'not-allowed' : 'pointer',
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
