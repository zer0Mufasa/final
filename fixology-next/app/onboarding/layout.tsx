// app/onboarding/layout.tsx
// Onboarding layout styled to match Fixology marketing/auth theme (dark glass + purple glow)

import type { ReactNode } from 'react'

const onboardingStyles = `
html{scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
body{background:#0f0a1a;min-height:100vh;overflow-x:hidden;color:#EDE9FE}
.bg-structure{position:fixed;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 50% 50%,#1a0f2e 0%,#0f0a1a 100%);z-index:-1}
.bg-grid{position:absolute;top:0;left:0;right:0;bottom:0;background:none;z-index:-1}
.vertical-rail{position:fixed;top:0;bottom:0;width:1px;background:linear-gradient(to bottom,transparent,rgba(167,139,250,0.08),transparent);z-index:1;pointer-events:none}
.vertical-rail.left{left:clamp(20px, 5vw, 80px)}
.vertical-rail.right{right:clamp(20px, 5vw, 80px)}
.wide-container{max-width:1600px;margin:0 auto;width:100%;padding:0 clamp(24px, 8vw, 120px);position:relative;z-index:2}
.glow-spot{position:absolute;width:640px;height:640px;background:radial-gradient(circle,rgba(167,139,250,0.10) 0%,transparent 70%);filter:blur(90px);pointer-events:none;z-index:0}
@keyframes gradient{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
.glass-card{background:linear-gradient(135deg,rgba(255,255,255,.04) 0%,rgba(15,10,26,.92) 100%);backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.10);border-radius:32px;box-shadow:0 24px 90px rgba(0,0,0,0.52)}
.glow-button{background:linear-gradient(135deg,#a78bfa 0%,#c4b5fd 50%,#a78bfa 100%);background-size:200% 200%;animation:gradient 3s ease infinite;border:none;border-radius:18px;padding:14px 18px;font-size:15px;font-weight:800;color:#0f0a1a;cursor:pointer;transition:transform .2s ease, box-shadow .2s ease;box-shadow:0 14px 46px rgba(167,139,250,.26)}
.glow-button:hover{transform:translateY(-2px);box-shadow:0 18px 64px rgba(167,139,250,.36)}
.glow-button:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:0 14px 46px rgba(167,139,250,.15)}
.glow-button-secondary{background:transparent;border:1px solid rgba(255,255,255,.14);color:rgba(196,181,253,.92);box-shadow:none}
.glow-button-secondary:hover{background:rgba(167,139,250,.10);border-color:rgba(167,139,250,.55);box-shadow:none}
.fx-label{display:block;font-size:11px;font-weight:800;color:rgba(196,181,253,.80);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
.fx-help{color:rgba(196,181,253,.60);font-size:12px;line-height:1.55}
.fx-input{width:100%;height:48px;padding:0 14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);border-radius:16px;color:#fff;font-size:14px;outline:none;transition:border-color .2s ease, box-shadow .2s ease}
.fx-input::placeholder{color:rgba(255,255,255,.28)}
.fx-input:focus{border-color:rgba(167,139,250,.55);box-shadow:0 0 0 3px rgba(139,92,246,.18)}
.fx-input[disabled]{opacity:.6;cursor:not-allowed}
.fx-select{appearance:none}
.fx-pill{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border-radius:999px;background:rgba(167,139,250,.12);border:1px solid rgba(167,139,250,.25);color:rgba(196,181,253,.95);font-size:13px;font-weight:800}
.section-title{font-weight:900;letter-spacing:-0.02em;line-height:1.05;color:#fff}
`

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: onboardingStyles }} />
      <div className="bg-structure">
        <div className="bg-grid" />
        <div className="vertical-rail left" />
        <div className="vertical-rail right" />
      </div>
      <div style={{ minHeight: '100vh', position: 'relative' }}>{children}</div>
    </>
  )
}


