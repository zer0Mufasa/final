'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 50%, #1a0f2e 0%, #0f0a1a 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '40px 24px'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .floating { animation: float 8s ease-in-out infinite; }
      ` }} />
      <div className="floating" style={{ position: 'absolute', top: '20%', left: '15%', fontSize: 48, opacity: 0.1, zIndex: 0 }}>📱</div>
      <div className="floating" style={{ position: 'absolute', bottom: '20%', right: '15%', fontSize: 48, opacity: 0.1, zIndex: 0, animationDelay: '2s' }}>🔧</div>
      
      <div style={{
        textAlign: 'center',
        maxWidth: 600,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: 120,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #a78bfa, #c4b5fd)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 24,
          lineHeight: 1
        }}>
          404
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 700,
          color: '#fff',
          marginBottom: 16
        }}>
          Page not found
        </h1>
        <p style={{
          fontSize: 18,
          color: '#c4b5fd',
          lineHeight: 1.7,
          marginBottom: 40,
          opacity: 0.9
        }}>
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #a78bfa 100%)',
              backgroundSize: '200% 200%',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              color: '#0f0a1a',
              textDecoration: 'none',
              transition: 'all .3s ease',
              boxShadow: '0 4px 20px rgba(167,139,250,.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(167,139,250,.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(167,139,250,.4)';
            }}
          >
            Go Home →
          </Link>
          <Link
            href="/#contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 32px',
              background: 'transparent',
              border: '1px solid rgba(167,139,250,.3)',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 500,
              color: 'rgba(196,181,253,.9)',
              textDecoration: 'none',
              transition: 'all .3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(167,139,250,.1)';
              e.currentTarget.style.borderColor = 'rgba(167,139,250,.5)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(167,139,250,.3)';
              e.currentTarget.style.color = 'rgba(196,181,253,.9)';
            }}
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}

