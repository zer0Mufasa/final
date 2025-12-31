'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  Check,
  Copy,
  Maximize2,
  MessageCircle,
  Minimize2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { searchKnowledge, type KnowledgeArticle } from './fixo-knowledge-base'

// ============================================
// FIXO AI ASSISTANT - CHAT WIDGET (UI-only)
// Knowledge-base search + local chat history
// ============================================

type Feedback = 'up' | 'down'

export interface FixoMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  sources?: KnowledgeArticle[]
  feedback?: Feedback
}

interface FixoContextType {
  isOpen: boolean
  isExpanded: boolean
  messages: FixoMessage[]
  isTyping: boolean
  openChat: () => void
  closeChat: () => void
  toggleExpanded: () => void
  sendMessage: (content: string) => void
  clearHistory: () => void
  setFeedback: (messageId: string, feedback: Feedback) => void
}

const FixoContext = createContext<FixoContextType | null>(null)

export function useFixo() {
  const ctx = useContext(FixoContext)
  if (!ctx) throw new Error('useFixo must be used within a FixoProvider')
  return ctx
}

const STORAGE_KEY = 'fixo-chat-history-v1'

export function FixoProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<FixoMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as FixoMessage[]
      if (Array.isArray(parsed)) setMessages(parsed)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // ignore
    }
  }, [messages])

  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])
  const toggleExpanded = useCallback(() => setIsExpanded((p) => !p), [])

  const setFeedback = useCallback((messageId: string, feedback: Feedback) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: m.feedback === feedback ? undefined : feedback } : m))
    )
  }, [])

  const clearHistory = useCallback(() => {
    setMessages([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const generateResponse = useCallback(async (userMessage: string) => {
    const results = searchKnowledge(userMessage)
    if (results.length === 0) {
      return {
        content:
          `I couldn't find an exact match in the Fixology knowledge base.\n\n` +
          `Try asking about:\n` +
          `• Creating tickets\n• Ticket stages\n• Inventory\n• Payments\n• Diagnostics\n• Notifications\n\n` +
          `Or rephrase your question and I’ll search again.`,
        sources: [] as KnowledgeArticle[],
      }
    }

    const top = results[0]
    const related = results.slice(1, 4)
    const extra =
      related.length > 0
        ? `\n\n---\n\nRelated topics:\n${related.map((a) => `• ${a.title}`).join('\n')}\n\nAsk me about any of these for more detail.`
        : ''

    return { content: `${top.content}${extra}`, sources: results.slice(0, 3) }
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim()
      if (!text) return

      const userMsg: FixoMessage = {
        id: `u_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)

      // soft typing delay
      await new Promise((r) => setTimeout(r, 450))

      const { content: resp, sources } = await generateResponse(text)
      const aiMsg: FixoMessage = {
        id: `a_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        role: 'assistant',
        content: resp,
        timestamp: Date.now(),
        sources,
      }

      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    },
    [generateResponse]
  )

  const value = useMemo<FixoContextType>(
    () => ({
      isOpen,
      isExpanded,
      messages,
      isTyping,
      openChat,
      closeChat,
      toggleExpanded,
      sendMessage,
      clearHistory,
      setFeedback,
    }),
    [clearHistory, closeChat, isExpanded, isOpen, isTyping, messages, openChat, sendMessage, setFeedback, toggleExpanded]
  )

  return <FixoContext.Provider value={value}>{children}</FixoContext.Provider>
}

export function FixoWidget() {
  const { isOpen, openChat, closeChat } = useFixo()

  return (
    <>
      {isOpen ? <FixoChatPanel onClose={closeChat} /> : null}

      {!isOpen ? (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.03] transition-all flex items-center justify-center"
          aria-label="Open Fixo AI Assistant"
        >
          <Sparkles className="w-6 h-6" aria-hidden="true" />
        </button>
      ) : null}
    </>
  )
}

function FixoChatPanel({ onClose }: { onClose: () => void }) {
  const { isExpanded, toggleExpanded, messages, isTyping, sendMessage, clearHistory, setFeedback } = useFixo()
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    sendMessage(text)
    setInput('')
  }

  const suggested = ['How do I create a ticket?', 'What do the ticket stages mean?', 'How do I set up payments?', 'How do panic logs work?']

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose} />

      <div
        className={cn(
          'pointer-events-auto absolute bg-[#0a0a0e] border border-white/[0.08] rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col',
          isExpanded
            ? 'inset-6 md:inset-10'
            : 'bottom-6 right-6 w-[380px] h-[620px] max-w-[calc(100vw-48px)] max-h-[calc(100vh-48px)]'
        )}
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-violet-500/[0.10] to-fuchsia-500/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white/95">Fixo</div>
              <div className="text-xs text-white/50">Fixology Knowledge Base</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={clearHistory}
              className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors text-white/60"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={toggleExpanded}
              className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors text-white/60"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors text-white/60" title="Close">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="mt-4 text-base font-semibold text-white/90">Ask Fixo</div>
              <div className="mt-2 text-sm text-white/55 max-w-[320px]">
                I can answer questions about tickets, payments, inventory, diagnostics, and settings.
              </div>
              <div className="mt-5 w-full space-y-2">
                {suggested.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10] transition-all text-sm text-white/75"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <ChatMessage key={m.id} msg={m} onFeedback={setFeedback} />
              ))}
              {isTyping ? <Typing /> : null}
              <div ref={endRef} />
            </>
          )}
        </div>

        {/* input */}
        <form onSubmit={onSubmit} className="p-3 border-t border-white/[0.06] bg-[#07070a]/30">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Fixo anything…"
              className="flex-1 h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={cn(
                'h-11 w-11 rounded-xl flex items-center justify-center transition-all',
                input.trim()
                  ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
                  : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
              )}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-center text-[10px] text-white/30">UI-only assistant. Verify important details.</div>
        </form>
      </div>
    </div>
  )
}

function ChatMessage({ msg, onFeedback }: { msg: FixoMessage; onFeedback: (id: string, fb: Feedback) => void }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
          isUser ? 'bg-white/[0.08] text-white/70' : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20'
        )}
      >
        {isUser ? <span className="text-[10px] font-semibold">You</span> : <Sparkles className="w-4 h-4 text-white" />}
      </div>

      <div className={cn('flex-1 min-w-0', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block max-w-[92%] px-4 py-3 rounded-2xl border text-sm text-left whitespace-pre-wrap leading-relaxed',
            isUser ? 'bg-violet-500/20 border-violet-500/30 text-white/90' : 'bg-white/[0.04] border-white/[0.08] text-white/85'
          )}
        >
          {msg.content}
        </div>

        <div className={cn('mt-2 flex items-center gap-2 text-[10px] text-white/30', isUser && 'justify-end')}>
          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

          {!isUser ? (
            <>
              <button onClick={copy} className="p-1 rounded hover:bg-white/[0.06] transition-colors text-white/40" title="Copy">
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={() => onFeedback(msg.id, 'up')}
                className={cn('p-1 rounded hover:bg-white/[0.06] transition-colors', msg.feedback === 'up' ? 'text-emerald-400' : 'text-white/40')}
                title="Helpful"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => onFeedback(msg.id, 'down')}
                className={cn('p-1 rounded hover:bg-white/[0.06] transition-colors', msg.feedback === 'down' ? 'text-rose-400' : 'text-white/40')}
                title="Not helpful"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>

              {msg.sources && msg.sources.length > 0 ? (
                <span className="ml-1">
                  Sources:{' '}
                  {msg.sources.slice(0, 2).map((s, i) => (
                    <span key={s.id} className="text-violet-300">
                      [{i + 1}]
                    </span>
                  ))}
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Typing() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

