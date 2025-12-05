/**
 * Fixology AI Chat Widget v8
 * Premium floating chat widget with starter prompts
 */
(function() {
    'use strict';

    const FIXOLOGY_GPT_URL = 'https://chatgpt.com/g/g-692e842d0dc48191989c1f877d00165d-fixology-repair-assistant';
    
    const styles = `
    #fixology-widget-btn{position:fixed;bottom:24px;right:24px;width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#C4B5FD 0%,#A78BFA 50%,#8B5CF6 100%);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(139,92,246,0.4);transition:all 0.3s;z-index:9998}
    #fixology-widget-btn:hover{transform:scale(1.08) translateY(-2px);box-shadow:0 12px 40px rgba(139,92,246,0.5)}
    #fixology-widget-btn img{width:36px;height:36px;filter:brightness(0) invert(1)}
    #fixology-widget-btn::after{content:'Fixology AI';position:absolute;right:76px;background:#1C1C22;color:#FAFAFA;padding:8px 14px;border-radius:10px;font-family:Inter,sans-serif;font-size:13px;font-weight:500;opacity:0;pointer-events:none;transition:opacity 0.2s;border:1px solid rgba(255,255,255,0.08)}
    #fixology-widget-btn:hover::after{opacity:1}
    #fixology-chat-panel{position:fixed;bottom:100px;right:24px;width:400px;height:580px;background:#0F0F12;border-radius:24px;box-shadow:0 25px 80px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06);display:none;flex-direction:column;overflow:hidden;z-index:9999;font-family:Inter,-apple-system,sans-serif}
    #fixology-chat-panel.open{display:flex;animation:slideUp 0.3s ease-out}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .fx-header{padding:20px 24px;background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05));border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:14px}
    .fx-avatar{width:48px;height:48px;background:linear-gradient(135deg,#A78BFA,#8B5CF6);border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(139,92,246,0.3)}
    .fx-avatar img{width:28px;height:28px;filter:brightness(0) invert(1)}
    .fx-info{flex:1}
    .fx-title{font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:600;color:#FAFAFA}
    .fx-status{font-size:13px;color:#A1A1AA;display:flex;align-items:center;gap:6px;margin-top:2px}
    .fx-dot{width:8px;height:8px;background:#22C55E;border-radius:50%}
    .fx-close{width:36px;height:36px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#A1A1AA;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center}
    .fx-close:hover{background:rgba(255,255,255,0.1);color:#FAFAFA}
    .fx-messages{flex:1;padding:24px;overflow-y:auto;display:flex;flex-direction:column;gap:16px}
    .fx-welcome{text-align:center;padding:20px 0}
    .fx-welcome-icon{font-size:48px;margin-bottom:16px}
    .fx-welcome-title{font-size:18px;font-weight:600;color:#FAFAFA;margin-bottom:8px}
    .fx-welcome-desc{font-size:14px;color:#71717A;line-height:1.6}
    .fx-starters{display:flex;flex-direction:column;gap:10px;margin-top:20px}
    .fx-starter{padding:14px 18px;background:#16161A;border:1px solid rgba(255,255,255,0.06);border-radius:14px;font-size:14px;color:#A1A1AA;cursor:pointer;transition:all 0.2s;text-align:left;display:flex;align-items:center;gap:12px}
    .fx-starter:hover{background:#1C1C22;border-color:rgba(139,92,246,0.3);color:#FAFAFA;transform:translateX(4px)}
    .fx-msg{max-width:85%;padding:14px 18px;border-radius:18px;font-size:14px;line-height:1.6}
    .fx-msg.bot{background:#1C1C22;color:#E4E4E7;align-self:flex-start;border-bottom-left-radius:6px}
    .fx-msg.user{background:linear-gradient(135deg,#A78BFA,#8B5CF6);color:white;align-self:flex-end;border-bottom-right-radius:6px}
    .fx-typing{display:flex;gap:5px;padding:14px 18px;background:#1C1C22;border-radius:18px;border-bottom-left-radius:6px;width:fit-content}
    .fx-typing span{width:8px;height:8px;background:#52525B;border-radius:50%;animation:bounce 1.4s infinite}
    .fx-typing span:nth-child(2){animation-delay:0.2s}
    .fx-typing span:nth-child(3){animation-delay:0.4s}
    @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
    .fx-input-area{padding:16px 20px;border-top:1px solid rgba(255,255,255,0.06);background:#0A0A0C}
    .fx-input-row{display:flex;gap:10px;align-items:center}
    .fx-input{flex:1;padding:14px 18px;background:#16161A;border:1px solid rgba(255,255,255,0.08);border-radius:14px;color:#FAFAFA;font-size:14px;outline:none}
    .fx-input::placeholder{color:#52525B}
    .fx-input:focus{border-color:rgba(139,92,246,0.5)}
    .fx-send{width:48px;height:48px;background:linear-gradient(135deg,#A78BFA,#8B5CF6);border:none;border-radius:14px;color:white;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center}
    .fx-send:hover{transform:scale(1.05)}
    .fx-powered{text-align:center;padding:12px;font-size:11px;color:#3F3F46}
    .fx-powered a{color:#6D28D9;text-decoration:none}
    @media(max-width:480px){#fixology-chat-panel{width:calc(100% - 32px);right:16px;bottom:90px;height:70vh}#fixology-widget-btn{bottom:16px;right:16px;width:56px;height:56px}#fixology-widget-btn::after{display:none}}
    `;

    function init() {
        const style = document.createElement('style');
        style.textContent = styles;
        document.head.appendChild(style);

        const btn = document.createElement('button');
        btn.id = 'fixology-widget-btn';
        btn.innerHTML = '<img src="https://i.ibb.co/GfPnk0zV/preview.webp" alt="Fixology AI">';
        btn.onclick = toggle;
        document.body.appendChild(btn);

        const panel = document.createElement('div');
        panel.id = 'fixology-chat-panel';
        panel.innerHTML = `
            <div class="fx-header">
                <div class="fx-avatar"><img src="https://i.ibb.co/GfPnk0zV/preview.webp" alt=""></div>
                <div class="fx-info">
                    <div class="fx-title">Fixology AI</div>
                    <div class="fx-status"><span class="fx-dot"></span>Online • Repair Intelligence</div>
                </div>
                <button class="fx-close" onclick="window.fxToggle()">×</button>
            </div>
            <div class="fx-messages" id="fx-messages">
                <div class="fx-welcome">
                    <div class="fx-welcome-icon">🧠</div>
                    <div class="fx-welcome-title">Hi! I'm the Fixology AI</div>
                    <div class="fx-welcome-desc">Trained on 1,200+ symptoms and real repair data. How can I help?</div>
                    <div class="fx-starters">
                        <div class="fx-starter" onclick="window.fxSend('I need help diagnosing a device')"><span>📱</span>Diagnose a device</div>
                        <div class="fx-starter" onclick="window.fxSend('Help me quote a repair')"><span>💰</span>Help me quote a repair</div>
                        <div class="fx-starter" onclick="window.fxSend('Explain a panic log')"><span>📋</span>Explain a panic log</div>
                    </div>
                </div>
            </div>
            <div class="fx-input-area">
                <div class="fx-input-row">
                    <input type="text" class="fx-input" id="fx-input" placeholder="Ask about repairs, diagnostics, quotes..." onkeypress="if(event.key==='Enter')window.fxSend()">
                    <button class="fx-send" onclick="window.fxSend()">→</button>
                </div>
                <div class="fx-powered">Powered by <a href="${FIXOLOGY_GPT_URL}" target="_blank">Fixology Intelligence</a></div>
            </div>
        `;
        document.body.appendChild(panel);

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && panel.classList.contains('open')) toggle();
        });
    }

    function toggle() {
        document.getElementById('fixology-chat-panel').classList.toggle('open');
    }

    function send(text) {
        const input = document.getElementById('fx-input');
        const msg = text || input.value.trim();
        if (!msg) return;

        const messages = document.getElementById('fx-messages');
        const welcome = messages.querySelector('.fx-welcome');
        if (welcome) welcome.remove();

        const userMsg = document.createElement('div');
        userMsg.className = 'fx-msg user';
        userMsg.textContent = msg;
        messages.appendChild(userMsg);
        input.value = '';

        const typing = document.createElement('div');
        typing.className = 'fx-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;

        setTimeout(() => {
            typing.remove();
            const botMsg = document.createElement('div');
            botMsg.className = 'fx-msg bot';
            botMsg.innerHTML = 'I\\'ll connect you with the full Fixology AI. <a href="' + FIXOLOGY_GPT_URL + '" target="_blank" style="color:#A78BFA">Click here to continue →</a>';
            messages.appendChild(botMsg);
            messages.scrollTop = messages.scrollHeight;
        }, 1500);
    }

    window.fxToggle = toggle;
    window.fxSend = send;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
