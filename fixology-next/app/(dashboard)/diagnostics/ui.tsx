'use client'

import { useEffect, useState, useRef } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/ui/toaster'
import {
  Send,
  Bot,
  User,
  Sparkles,
  Wrench,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Package,
  Lightbulb,
  ExternalLink,
  RotateCcw,
  Bookmark,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Target,
  ListChecks,
  ShieldAlert,
  Cpu,
  ChevronDown,
  Loader2,
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  diagnosis?: DiagnosisResult
}

interface DiagnosisResult {
  // Main diagnosis
  summary: string
  confidence: number
  
  // Detailed breakdown
  possibleCauses: {
    cause: string
    likelihood: 'high' | 'medium' | 'low'
    explanation: string
  }[]
  
  // Step-by-step diagnosis
  diagnosticSteps: {
    step: number
    title: string
    description: string
    expectedResult: string
    tools?: string[]
  }[]
  
  // Repair guide
  repairGuide: {
    difficulty: 'easy' | 'medium' | 'hard' | 'expert'
    estimatedTime: string
    steps: {
      step: number
      title: string
      description: string
      tip?: string
      warning?: string
    }[]
  }
  
  // Parts & pricing
  partsNeeded: {
    part: string
    compatibility: string
    estimatedCost: string
    supplier?: string
  }[]
  
  suggestedPrice: {
    min: number
    max: number
    laborTime: string
  }
  
  // Warnings & tips
  commonMistakes: string[]
  proTips: string[]
  warnings: string[]
  
  // Sources
  sources?: string[]
}

const QUICK_PROMPTS = [
  { icon: '📱', label: 'iPhone not charging', prompt: 'iPhone not charging, tried different cables' },
  { icon: '🔋', label: 'Battery draining fast', prompt: 'Phone battery drains very fast, gets hot' },
  { icon: '📺', label: 'Screen issues', prompt: 'Screen flickering and has lines' },
  { icon: '🔊', label: 'No sound', prompt: 'Phone has no sound, speaker not working' },
  { icon: '💧', label: 'Water damage', prompt: 'Phone dropped in water, not turning on' },
  { icon: '🔄', label: 'Boot loop', prompt: 'Phone stuck in boot loop, keeps restarting' },
]

export function DiagnosticsClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const isDemo = () => {
    if (typeof document === 'undefined') return false
    return document.cookie.includes('fx_demo=1')
  }

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    setInput('')
    setShowQuickPrompts(false)
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 18000) // client-side guard

      const demo = isDemo()
      const url = demo ? '/api/ai/diagnostics?demo=1' : '/api/ai/diagnostics'

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(demo ? { 'x-fx-demo': '1' } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.role === 'assistant' && m.diagnosis 
              ? `[Previous diagnosis about: ${m.diagnosis.summary}]` 
              : m.content,
          })),
        }),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to analyze')
      }

      const data = await res.json()

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || '',
        timestamp: new Date(),
        diagnosis: data.diagnosis,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (e: any) {
      const friendly = e?.name === 'AbortError'
        ? 'That took too long. Please try again with device model + symptoms.'
        : (e?.message || 'Failed to get diagnosis')

      toast.error(friendly)
      // Add error message bubble so the chat isn’t empty
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: friendly,
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setShowQuickPrompts(true)
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              AI Diagnostics
            </h1>
            <p className="text-white/50 mt-1 text-sm">
              Describe any device issue • Get step-by-step repair guidance
            </p>
          </div>
          
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-white/50 hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && showQuickPrompts && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-violet-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  What device needs repair?
                </h2>
                <p className="text-white/50 text-sm max-w-md mb-8">
                  Describe the device, symptoms, and any relevant history. I'll give you a detailed diagnosis with step-by-step repair instructions.
                </p>
                
                {/* Quick prompts */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-2xl">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => sendMessage(qp.prompt)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-violet-500/30 transition-all text-left group"
                    >
                      <span className="text-lg">{qp.icon}</span>
                      <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                        {qp.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-white/60">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing issue...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t border-white/[0.08] bg-white/[0.02]">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe the device and issue... (e.g., iPhone 13 Pro, screen went black after drop, but phone still vibrates)"
                  rows={1}
                  className="w-full resize-none rounded-xl bg-white/[0.05] border border-white/[0.1] px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text-sm"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/30 mt-2 text-center">
              Powered by repair.wiki knowledge base • Press Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Message Bubble Component
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%] bg-gradient-to-r from-violet-500/20 to-purple-600/20 border border-violet-500/30 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-white text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white/70" />
        </div>
      </div>
    )
  }

  // Assistant message with diagnosis
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 space-y-3 max-w-[90%]">
        {/* Text response */}
        {message.content && (
          <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-white/90 text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {/* Diagnosis Cards */}
        {message.diagnosis && (
          <DiagnosisCards diagnosis={message.diagnosis} />
        )}
      </div>
    </div>
  )
}

// Diagnosis Cards Component
function DiagnosisCards({ diagnosis }: { diagnosis: DiagnosisResult }) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['causes', 'diagnostic', 'repair'])
  )

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const difficultyColors = {
    easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    hard: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    expert: 'text-red-400 bg-red-400/10 border-red-400/30',
  }

  const likelihoodColors = {
    high: 'bg-red-400',
    medium: 'bg-yellow-400',
    low: 'bg-emerald-400',
  }

  return (
    <div className="space-y-3">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-violet-300 font-medium mb-1">
              <Target className="w-3.5 h-3.5" />
              DIAGNOSIS
            </div>
            <h3 className="text-white font-semibold">{diagnosis.summary}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{diagnosis.confidence}%</div>
            <div className="text-xs text-white/50">confidence</div>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
          <div className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium border",
            difficultyColors[diagnosis.repairGuide.difficulty]
          )}>
            {diagnosis.repairGuide.difficulty.toUpperCase()} REPAIR
          </div>
          <div className="flex items-center gap-1.5 text-white/60 text-sm">
            <Clock className="w-4 h-4" />
            {diagnosis.repairGuide.estimatedTime}
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
            <DollarSign className="w-4 h-4" />
            ${diagnosis.suggestedPrice.min} - ${diagnosis.suggestedPrice.max}
          </div>
        </div>
      </div>

      {/* Possible Causes */}
      <CollapsibleCard
        title="Possible Causes"
        icon={<Lightbulb className="w-4 h-4" />}
        isExpanded={expandedSections.has('causes')}
        onToggle={() => toggleSection('causes')}
        count={diagnosis.possibleCauses.length}
      >
        <div className="space-y-3">
          {diagnosis.possibleCauses.map((cause, i) => (
            <div key={i} className="flex gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                likelihoodColors[cause.likelihood]
              )} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{cause.cause}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    cause.likelihood === 'high' ? 'bg-red-400/10 text-red-400' :
                    cause.likelihood === 'medium' ? 'bg-yellow-400/10 text-yellow-400' :
                    'bg-emerald-400/10 text-emerald-400'
                  )}>
                    {cause.likelihood}
                  </span>
                </div>
                <p className="text-white/60 text-sm mt-1">{cause.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleCard>

      {/* Diagnostic Steps */}
      <CollapsibleCard
        title="How to Diagnose"
        icon={<ListChecks className="w-4 h-4" />}
        isExpanded={expandedSections.has('diagnostic')}
        onToggle={() => toggleSection('diagnostic')}
        count={diagnosis.diagnosticSteps.length}
        accentColor="cyan"
      >
        <div className="space-y-4">
          {diagnosis.diagnosticSteps.map((step) => (
            <div key={step.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-cyan-400">
                {step.step}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium text-sm">{step.title}</h4>
                <p className="text-white/60 text-sm mt-1">{step.description}</p>
                <div className="mt-2 px-3 py-2 rounded-lg bg-cyan-400/5 border border-cyan-400/10">
                  <span className="text-xs text-cyan-400 font-medium">Expected: </span>
                  <span className="text-xs text-white/70">{step.expectedResult}</span>
                </div>
                {step.tools && step.tools.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Wrench className="w-3 h-3 text-white/40" />
                    <span className="text-xs text-white/40">Tools: {step.tools.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleCard>

      {/* Repair Steps */}
      <CollapsibleCard
        title="How to Fix"
        icon={<Wrench className="w-4 h-4" />}
        isExpanded={expandedSections.has('repair')}
        onToggle={() => toggleSection('repair')}
        count={diagnosis.repairGuide.steps.length}
        accentColor="emerald"
      >
        <div className="space-y-4">
          {diagnosis.repairGuide.steps.map((step) => (
            <div key={step.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-400">
                {step.step}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium text-sm">{step.title}</h4>
                <p className="text-white/60 text-sm mt-1">{step.description}</p>
                {step.tip && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-emerald-400/5 border border-emerald-400/10 flex items-start gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-emerald-300">{step.tip}</span>
                  </div>
                )}
                {step.warning && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-red-400/5 border border-red-400/10 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-red-300">{step.warning}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleCard>

      {/* Parts Needed */}
      {diagnosis.partsNeeded && diagnosis.partsNeeded.length > 0 && (
        <CollapsibleCard
          title="Parts Needed"
          icon={<Package className="w-4 h-4" />}
          isExpanded={expandedSections.has('parts')}
          onToggle={() => toggleSection('parts')}
          count={diagnosis.partsNeeded.length}
          accentColor="amber"
        >
          <div className="space-y-2">
            {diagnosis.partsNeeded.map((part, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <div className="text-white font-medium text-sm">{part.part}</div>
                  <div className="text-white/50 text-xs mt-0.5">{part.compatibility}</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-semibold">{part.estimatedCost}</div>
                  {part.supplier && (
                    <div className="text-white/40 text-xs">{part.supplier}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleCard>
      )}

      {/* Warnings */}
      {diagnosis.warnings && diagnosis.warnings.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 font-medium text-sm mb-3">
            <ShieldAlert className="w-4 h-4" />
            Warnings
          </div>
          <ul className="space-y-2">
            {diagnosis.warnings.map((warning, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-300/80">
                <span className="text-red-400 mt-1">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pro Tips */}
      {diagnosis.proTips && diagnosis.proTips.length > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm mb-3">
            <Zap className="w-4 h-4" />
            Pro Tips
          </div>
          <ul className="space-y-2">
            {diagnosis.proTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-300/80">
                <span className="text-emerald-400 mt-1">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Mistakes */}
      {diagnosis.commonMistakes && diagnosis.commonMistakes.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-400 font-medium text-sm mb-3">
            <AlertTriangle className="w-4 h-4" />
            Common Mistakes to Avoid
          </div>
          <ul className="space-y-2">
            {diagnosis.commonMistakes.map((mistake, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-300/80">
                <span className="text-amber-400 mt-1">•</span>
                {mistake}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {diagnosis.sources && diagnosis.sources.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <ExternalLink className="w-3 h-3" />
          Sources: {diagnosis.sources.map((s, i) => (
            <a 
              key={i} 
              href={s} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline"
            >
              repair.wiki
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// Collapsible Card Component
function CollapsibleCard({
  title,
  icon,
  children,
  isExpanded,
  onToggle,
  count,
  accentColor = 'violet',
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  count?: number
  accentColor?: 'violet' | 'cyan' | 'emerald' | 'amber'
}) {
  const colors = {
    violet: 'text-violet-400 border-violet-500/20',
    cyan: 'text-cyan-400 border-cyan-500/20',
    emerald: 'text-emerald-400 border-emerald-500/20',
    amber: 'text-amber-400 border-amber-500/20',
  }

  return (
    <div className={cn(
      "bg-white/[0.03] border rounded-xl overflow-hidden transition-all",
      colors[accentColor]
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={colors[accentColor].split(' ')[0]}>{icon}</span>
          <span className="text-white font-medium text-sm">{title}</span>
          {count && (
            <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
              {count} steps
            </span>
          )}
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-white/40 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/[0.05]">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
