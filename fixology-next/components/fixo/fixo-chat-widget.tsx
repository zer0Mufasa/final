'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'
import { 
  X, 
  Send, 
  Sparkles, 
  Minimize2, 
  Maximize2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

// ============================================
// FIXO AI ASSISTANT - REAL AI VERSION
// Uses Novita AI (Llama 3.3 70B) for intelligent responses
// ============================================

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// ============================================
// TYPES
// ============================================

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  feedback?: 'up' | 'down'
  error?: boolean
}

interface FixoContextType {
  isOpen: boolean
  isExpanded: boolean
  messages: Message[]
  isTyping: boolean
  openChat: () => void
  closeChat: () => void
  toggleExpanded: () => void
  sendMessage: (content: string) => void
  retryLastMessage: () => void
  clearHistory: () => void
  setFeedback: (messageId: string, feedback: 'up' | 'down') => void
}

// ============================================
// CONTEXT
// ============================================

const FixoContext = createContext<FixoContextType | null>(null)

export function useFixo() {
  const context = useContext(FixoContext)
  if (!context) {
    throw new Error('useFixo must be used within a FixoProvider')
  }
  return context
}

// ============================================
// PROVIDER
// ============================================

export function FixoProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)

  // Load from localStorage and add initial greeting if new conversation
  useEffect(() => {
    const saved = localStorage.getItem('fixo-chat-history-v2')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })))
      } catch (e) {
        console.error('Failed to load chat history')
      }
    } else {
      // First time opening chat - add welcome message
      const welcomeMessage: Message = {
        id: 'welcome-fixo',
        role: 'assistant',
        content: "Hi! My name is Fixo 👋 I'm your AI assistant for Fixology. I can help you with repair diagnostics, platform questions, ticket management, and anything else related to your repair shop. What can I help you with today?",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('fixo-chat-history-v2', JSON.stringify(messages))
    }
  }, [messages])

  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])
  const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), [])

  const callFixoAPI = useCallback(async (userMessage: string, history: Message[]): Promise<string> => {
    const response = await fetch('/api/fixo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        history: history
          .filter(m => !m.error)
          .map(m => ({ role: m.role, content: m.content }))
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get response')
    }

    const data = await response.json()
    return data.response
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isTyping) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      const responseContent = await callFixoAPI(content, [...messages, userMessage])

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Fixo AI Error:', error)
      
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: error.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        error: true
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }, [messages, isTyping, callFixoAPI])

  const retryLastMessage = useCallback(async () => {
    // Find the last user message
    const lastUserIndex = messages.map(m => m.role).lastIndexOf('user')
    if (lastUserIndex === -1) return

    const lastUserMessage = messages[lastUserIndex]
    
    // Remove everything after the last user message
    const historyBeforeRetry = messages.slice(0, lastUserIndex)
    
    setMessages(historyBeforeRetry)
    
    // Resend
    await sendMessage(lastUserMessage.content)
  }, [messages, sendMessage])

  const clearHistory = useCallback(() => {
    // Add welcome message when clearing history
    const welcomeMessage: Message = {
      id: 'welcome-fixo',
      role: 'assistant',
      content: "Hi! My name is Fixo 👋 I'm your AI assistant for Fixology. I can help you with repair diagnostics, platform questions, ticket management, and anything else related to your repair shop. What can I help you with today?",
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
    localStorage.setItem('fixo-chat-history-v2', JSON.stringify([welcomeMessage]))
  }, [])

  const setFeedback = useCallback((messageId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, feedback } : m
    ))
  }, [])

  return (
    <FixoContext.Provider value={{
      isOpen,
      isExpanded,
      messages,
      isTyping,
      openChat,
      closeChat,
      toggleExpanded,
      sendMessage,
      retryLastMessage,
      clearHistory,
      setFeedback
    }}>
      {children}
    </FixoContext.Provider>
  )
}

// ============================================
// WIDGET
// ============================================

export function FixoWidget() {
  const { isOpen, openChat } = useFixo()

  return (
    <>
      {isOpen && <FixoChatPanel />}

      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all flex items-center justify-center group"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#07070a]">
            <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
          </span>
        </button>
      )}
    </>
  )
}

// ============================================
// CHAT PANEL
// ============================================

function FixoChatPanel() {
  const { 
    isExpanded, 
    messages, 
    isTyping, 
    closeChat, 
    toggleExpanded, 
    sendMessage, 
    retryLastMessage,
    clearHistory,
    setFeedback 
  } = useFixo()
  
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isTyping) {
      sendMessage(input)
      setInput('')
    }
  }

  const suggestions = [
    "How do I create a ticket?",
    "Explain the ticket stages",
    "How do payments work?",
    "Help me set up inventory",
  ]

  const hasError = messages.length > 0 && messages[messages.length - 1]?.error

  return (
    <div 
      className={cn(
        "fixed z-50 bg-[#0a0a0e] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden transition-all duration-300",
        isExpanded 
          ? "bottom-6 right-6 left-6 top-6 md:left-auto md:w-[600px] md:top-6" 
          : "bottom-6 right-6 w-[400px] h-[600px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-violet-500/[0.08] to-fuchsia-500/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white/95 flex items-center gap-2">
              Fixo
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">AI</span>
            </div>
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Powered by Llama 3.3
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={clearHistory}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleExpanded}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={closeChat}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 || (messages.length === 1 && messages[0].id === 'welcome-fixo' && messages[0].role === 'assistant') ? (
          messages.length === 0 ? (
            <WelcomeScreen onSuggest={sendMessage} suggestions={suggestions} />
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  onFeedback={setFeedback}
                  onRetry={message.error ? retryLastMessage : undefined}
                />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                onFeedback={setFeedback}
                onRetry={message.error ? retryLastMessage : undefined}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error retry banner */}
      {hasError && !isTyping && (
        <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 flex items-center justify-between">
          <span className="text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed to get response
          </span>
          <button
            onClick={retryLastMessage}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isTyping ? "Fixo is thinking..." : "Ask Fixo anything..."}
            disabled={isTyping}
            className="flex-1 h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !isTyping
                ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                : "bg-white/[0.04] text-white/30 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

// ============================================
// WELCOME SCREEN
// ============================================

function WelcomeScreen({ onSuggest, suggestions }: { onSuggest: (q: string) => void; suggestions: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-lg font-semibold text-white/95 mb-2">
        Hey! I'm Fixo 👋
      </h2>
      <p className="text-sm text-white/60 mb-6 max-w-xs">
        Your AI assistant for Fixology. I'm powered by Llama 3.3 and can help with anything about your repair shop!
      </p>

      <div className="w-full space-y-2">
        <p className="text-xs text-white/40 mb-2">Try asking:</p>
        {suggestions.map((q) => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-sm text-white/70 hover:text-white/90"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// CHAT MESSAGE
// ============================================

function ChatMessage({ 
  message, 
  onFeedback,
  onRetry
}: { 
  message: Message
  onFeedback: (id: string, feedback: 'up' | 'down') => void
  onRetry?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
        isUser 
          ? "bg-white/[0.08] text-white/70" 
          : message.error
            ? "bg-rose-500/20 border border-rose-500/30"
            : "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20"
      )}>
        {isUser ? (
          <span className="text-xs font-semibold">You</span>
        ) : message.error ? (
          <AlertCircle className="w-4 h-4 text-rose-400" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={cn("flex-1 min-w-0", isUser && "text-right")}>
        <div className={cn(
          "inline-block px-4 py-3 rounded-2xl text-sm max-w-[90%] text-left",
          isUser 
            ? "bg-violet-500/20 border border-violet-500/30 text-white/90" 
            : message.error
              ? "bg-rose-500/10 border border-rose-500/20 text-rose-300"
              : "bg-white/[0.04] border border-white/[0.08] text-white/85"
        )}>
          <FormattedContent content={message.content} />
        </div>

        {!isUser && (
          <div className="flex items-center gap-2 mt-2 pl-1">
            <span className="text-[10px] text-white/30">
              {formatTime(message.timestamp)}
            </span>
            
            {!message.error && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/50"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => onFeedback(message.id, 'up')}
                  className={cn(
                    "p-1 rounded hover:bg-white/[0.06] transition-colors",
                    message.feedback === 'up' ? "text-emerald-400" : "text-white/30 hover:text-white/50"
                  )}
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onFeedback(message.id, 'down')}
                  className={cn(
                    "p-1 rounded hover:bg-white/[0.06] transition-colors",
                    message.feedback === 'down' ? "text-rose-400" : "text-white/30 hover:text-white/50"
                  )}
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            )}

            {message.error && onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        )}

        {isUser && (
          <div className="text-[10px] text-white/30 mt-1 pr-1">
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// FORMATTED CONTENT
// ============================================

function FormattedContent({ content }: { content: string }) {
  // Convert markdown-style formatting to HTML
  const formatted = content
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white/95 font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="text-white/70">$1</em>')
    // Code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/[0.08] text-violet-300 text-xs font-mono">$1</code>')
    // Line breaks
    .replace(/\n/g, '<br />')

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: formatted }} 
      className="leading-relaxed"
    />
  )
}

// ============================================
// TYPING INDICATOR
// ============================================

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
        <Sparkles className="w-4 h-4 text-white animate-pulse" />
      </div>
      <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-violet-400/60 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-violet-400/60 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-violet-400/60 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

// ============================================
// EXPORTS
// ============================================

export function FixoTriggerButton({ 
  className,
  children 
}: { 
  className?: string
  children?: ReactNode 
}) {
  const { openChat } = useFixo()

  return (
    <button
      onClick={openChat}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all",
        className
      )}
    >
      <Sparkles className="w-4 h-4" />
      {children || "Ask Fixo"}
    </button>
  )
}
