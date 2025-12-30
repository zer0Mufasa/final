// app/(auth)/layout.tsx
// Layout for authentication pages (shares marketing theme)

import type { ReactNode } from 'react'

const authGlobalStyles = `
html{scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
/* AUTH ONLY. Do not share marketing grids/hero typography here. */
body{background:#0f0a1a;min-height:100vh;overflow-x:hidden;color:#EDE9FE}
.bg-structure{position:fixed;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 50% 50%,#1a0f2e 0%,#0f0a1a 100%);z-index:-1}
.bg-grid{position:absolute;top:0;left:0;right:0;bottom:0;background:none;z-index:-1}
.vertical-rail{position:fixed;top:0;bottom:0;width:1px;background:linear-gradient(to bottom,transparent,rgba(167,139,250,0.08),transparent);z-index:1;pointer-events:none}
.vertical-rail.left{left:clamp(20px, 5vw, 80px)}
.vertical-rail.right{right:clamp(20px, 5vw, 80px)}
.wide-container{max-width:1600px;margin:0 auto;width:100%;padding:0 clamp(24px, 8vw, 120px);position:relative;z-index:2}
.glow-spot{position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(167,139,250,0.08) 0%,transparent 70%);filter:blur(80px);pointer-events:none;z-index:0}
@keyframes gradient{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
@keyframes fadeSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.fade-in{animation:fadeSlideUp .6s ease-out both}
.glass-card{background:linear-gradient(135deg,rgba(167,139,250,.08) 0%,rgba(15,10,26,.9) 100%);backdrop-filter:blur(20px);border:1px solid rgba(167,139,250,.15);border-radius:24px;box-shadow:0 20px 80px rgba(0,0,0,0.45)}
.glow-button{background:linear-gradient(135deg,#a78bfa 0%,#c4b5fd 50%,#a78bfa 100%);background-size:200% 200%;animation:gradient 3s ease infinite;border:none;border-radius:16px;padding:14px 18px;font-size:15px;font-weight:700;color:#0f0a1a;cursor:pointer;transition:transform .2s ease, box-shadow .2s ease;box-shadow:0 10px 30px rgba(167,139,250,.22)}
.glow-button:hover{transform:translateY(-2px);box-shadow:0 14px 46px rgba(167,139,250,.35)}
.glow-button:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:0 10px 30px rgba(167,139,250,.12)}
.glow-button-secondary{background:transparent;border:1px solid rgba(167,139,250,.35);color:rgba(196,181,253,.92);box-shadow:none}
.glow-button-secondary:hover{background:rgba(167,139,250,.10);border-color:rgba(167,139,250,.55);box-shadow:none}
.auth-label{display:block;font-size:11px;font-weight:700;color:rgba(196,181,253,.8);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
.auth-input{width:100%;padding:12px 14px 12px 44px;background:rgba(15,10,26,.65);border:1px solid rgba(167,139,250,.20);border-radius:12px;color:#fff;font-size:14px;outline:none;transition:border-color .2s ease, box-shadow .2s ease}
.auth-input::placeholder{color:rgba(196,181,253,.45)}
.auth-input:focus{border-color:rgba(167,139,250,.45);box-shadow:0 0 0 3px rgba(167,139,250,.12)}
.auth-error{margin-top:8px;font-size:12px;color:#ef4444}
.auth-muted{color:rgba(196,181,253,.70)}
.auth-link{color:rgba(196,181,253,.86);text-decoration:none}
.auth-link:hover{color:#fff;text-decoration:underline}
.auth-kicker{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(167,139,250,.12);border:1px solid rgba(167,139,250,.25);color:rgba(196,181,253,.9);font-size:12px;font-weight:600}
.section-title{font-weight:800;letter-spacing:-0.02em;line-height:1.1;color:#fff}
`

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: authGlobalStyles }} />
      <div className="bg-structure">
        <div className="bg-grid" />
        <div className="vertical-rail left" />
        <div className="vertical-rail right" />
      </div>
      <div style={{ minHeight: '100vh', position: 'relative' }}>{children}</div>
    </>
  )
}

