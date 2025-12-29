/**
 * Fixology Diagnostic Assistant Widget v9.0
 * 
 * Premium floating chat widget that connects to /api/fixology-chat
 * for AI-powered device diagnostics, IMEI checks, and support.
 * 
 * 100% Fixology branded - no external AI references.
 */
(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════
    
    function getFixologyApiBase() {
        const fromWindow = typeof window !== 'undefined' ? window.FIXOLOGY_API_BASE : '';
        const fromStorage = (() => {
            try { return localStorage.getItem('FIXOLOGY_API_BASE') || ''; } catch { return ''; }
        })();
        return (fromWindow || fromStorage || '').trim().replace(/\/+$/, '');
    }

    const CONFIG = {
        apiEndpoint: (() => {
            const base = getFixologyApiBase();
            return base ? `${base}/api/fixology-chat` : '/api/fixology-chat';
        })(),
        // For local development, use:
        // apiEndpoint: 'http://localhost:3000/api/fixology-chat',
        
        // Determine role from URL path
        role: window.location.pathname.includes('/dashboard') ? 'shop' : 'customer',
        
        // Generate session ID for conversation continuity
        sessionId: 'fx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };

    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════
    
    let messages = [];
    let isLoading = false;
    let isOpen = false;

    // ═══════════════════════════════════════════════════════════════
    // STYLES
    // ═══════════════════════════════════════════════════════════════
    
    const styles = `
    /* Fixology Chat Widget Styles */
    #fixology-widget-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #8B5CF6 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 9998;
    }
    
    #fixology-widget-btn:hover {
        transform: scale(1.08) translateY(-2px);
        box-shadow: 0 12px 40px rgba(139, 92, 246, 0.5);
    }
    
    #fixology-widget-btn img {
        width: 36px;
        height: 36px;
        filter: brightness(0) invert(1);
    }
    
    #fixology-widget-btn::after {
        content: 'Fixology AI';
        position: absolute;
        right: 76px;
        background: #1C1C22;
        color: #FAFAFA;
        padding: 8px 14px;
        border-radius: 10px;
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 500;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
        border: 1px solid rgba(255, 255, 255, 0.08);
        white-space: nowrap;
    }
    
    #fixology-widget-btn:hover::after {
        opacity: 1;
    }
    
    #fixology-widget-btn.has-unread::before {
        content: '';
        position: absolute;
        top: -4px;
        right: -4px;
        width: 16px;
        height: 16px;
        background: #22C55E;
        border-radius: 50%;
        border: 2px solid #0F0F12;
    }
    
    /* Chat Panel */
    #fixology-chat-panel {
        position: fixed;
        bottom: 100px;
        right: 24px;
        width: 400px;
        height: 600px;
        background: #0F0F12;
        border-radius: 24px;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 9999;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    #fixology-chat-panel.open {
        display: flex;
        animation: fxSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    @keyframes fxSlideUp {
        from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    /* Header */
    .fx-header {
        padding: 18px 20px;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05));
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        display: flex;
        align-items: center;
        gap: 14px;
    }
    
    .fx-avatar {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #A78BFA, #8B5CF6);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        flex-shrink: 0;
    }
    
    .fx-avatar img {
        width: 26px;
        height: 26px;
        filter: brightness(0) invert(1);
    }
    
    .fx-info {
        flex: 1;
        min-width: 0;
    }
    
    .fx-title {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #FAFAFA;
        margin-bottom: 2px;
    }
    
    .fx-subtitle {
        font-size: 12px;
        color: #A1A1AA;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .fx-status-dot {
        width: 8px;
        height: 8px;
        background: #22C55E;
        border-radius: 50%;
        animation: fxPulse 2s infinite;
    }
    
    @keyframes fxPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    .fx-close {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        color: #A1A1AA;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }
    
    .fx-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #FAFAFA;
    }
    
    /* Messages Area */
    .fx-messages {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
        scroll-behavior: smooth;
    }
    
    .fx-messages::-webkit-scrollbar {
        width: 6px;
    }
    
    .fx-messages::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .fx-messages::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
    }
    
    /* Welcome Screen */
    .fx-welcome {
        text-align: center;
        padding: 20px 0;
    }
    
    .fx-welcome-icon {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1));
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        font-size: 32px;
    }
    
    .fx-welcome-title {
        font-size: 18px;
        font-weight: 600;
        color: #FAFAFA;
        margin-bottom: 10px;
    }
    
    .fx-welcome-desc {
        font-size: 14px;
        color: #71717A;
        line-height: 1.6;
        max-width: 280px;
        margin: 0 auto;
    }
    
    /* Quick Action Buttons */
    .fx-starters {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 24px;
    }
    
    .fx-starter {
        padding: 14px 18px;
        background: #16161A;
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 14px;
        font-size: 14px;
        color: #A1A1AA;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .fx-starter:hover {
        background: #1C1C22;
        border-color: rgba(139, 92, 246, 0.3);
        color: #FAFAFA;
        transform: translateX(4px);
    }
    
    .fx-starter-icon {
        width: 32px;
        height: 32px;
        background: rgba(139, 92, 246, 0.15);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
    }
    
    /* Messages */
    .fx-msg {
        max-width: 85%;
        padding: 14px 18px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.6;
        animation: fxFadeIn 0.3s ease-out;
    }
    
    @keyframes fxFadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .fx-msg.assistant {
        background: #1C1C22;
        color: #E4E4E7;
        align-self: flex-start;
        border-bottom-left-radius: 6px;
    }
    
    .fx-msg.user {
        background: linear-gradient(135deg, #A78BFA, #8B5CF6);
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 6px;
    }
    
    .fx-msg p {
        margin: 0 0 10px 0;
    }
    
    .fx-msg p:last-child {
        margin-bottom: 0;
    }
    
    .fx-msg ul, .fx-msg ol {
        margin: 8px 0;
        padding-left: 20px;
    }
    
    .fx-msg li {
        margin: 4px 0;
    }
    
    .fx-msg strong {
        color: #FAFAFA;
    }
    
    .fx-msg code {
        background: rgba(139, 92, 246, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 13px;
    }
    
    /* Typing Indicator */
    .fx-typing {
        display: flex;
        gap: 5px;
        padding: 14px 18px;
        background: #1C1C22;
        border-radius: 18px;
        border-bottom-left-radius: 6px;
        width: fit-content;
        align-self: flex-start;
    }
    
    .fx-typing span {
        width: 8px;
        height: 8px;
        background: #52525B;
        border-radius: 50%;
        animation: fxBounce 1.4s infinite;
    }
    
    .fx-typing span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .fx-typing span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes fxBounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-6px); }
    }
    
    /* Suggested Actions */
    .fx-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
    }
    
    .fx-action-btn {
        padding: 8px 14px;
        background: rgba(139, 92, 246, 0.15);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 20px;
        font-size: 12px;
        color: #C4B5FD;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .fx-action-btn:hover {
        background: rgba(139, 92, 246, 0.25);
        color: #FAFAFA;
    }
    
    /* Input Area */
    .fx-input-area {
        padding: 16px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        background: #0A0A0C;
    }
    
    .fx-input-row {
        display: flex;
        gap: 10px;
        align-items: flex-end;
    }
    
    .fx-input-wrapper {
        flex: 1;
        position: relative;
    }
    
    .fx-input {
        width: 100%;
        padding: 14px 18px;
        background: #16161A;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        color: #FAFAFA;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
        resize: none;
        min-height: 48px;
        max-height: 120px;
    }
    
    .fx-input::placeholder {
        color: #52525B;
    }
    
    .fx-input:focus {
        border-color: rgba(139, 92, 246, 0.5);
    }
    
    .fx-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .fx-send {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #A78BFA, #8B5CF6);
        border: none;
        border-radius: 14px;
        color: white;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }
    
    .fx-send:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
    }
    
    .fx-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }
    
    /* Footer */
    .fx-footer {
        text-align: center;
        padding: 12px;
        font-size: 11px;
        color: #3F3F46;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }
    
    .fx-footer a {
        color: #6D28D9;
        text-decoration: none;
    }
    
    .fx-footer a:hover {
        text-decoration: underline;
    }
    
    /* Error Message */
    .fx-error {
        padding: 12px 16px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 12px;
        color: #FCA5A5;
        font-size: 13px;
        align-self: stretch;
    }
    
    /* IMEI Status Badge */
    .fx-imei-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 12px;
    }
    
    .fx-imei-badge.clean {
        background: rgba(34, 197, 94, 0.15);
        color: #22C55E;
    }
    
    .fx-imei-badge.warning {
        background: rgba(245, 158, 11, 0.15);
        color: #F59E0B;
    }
    
    .fx-imei-badge.flagged {
        background: rgba(239, 68, 68, 0.15);
        color: #EF4444;
    }
    
    /* Mobile Responsive */
    @media (max-width: 480px) {
        #fixology-chat-panel {
            width: calc(100% - 32px);
            right: 16px;
            left: 16px;
            bottom: 90px;
            height: 70vh;
            max-height: 600px;
        }
        
        #fixology-widget-btn {
            bottom: 16px;
            right: 16px;
            width: 56px;
            height: 56px;
        }
        
        #fixology-widget-btn::after {
            display: none;
        }
        
        .fx-header {
            padding: 14px 16px;
        }
        
        .fx-messages {
            padding: 16px;
        }
        
        .fx-input-area {
            padding: 12px 16px;
        }
    }
    `;

    // ═══════════════════════════════════════════════════════════════
    // TEMPLATE BUILDERS
    // ═══════════════════════════════════════════════════════════════
    
    function buildWidgetHTML() {
        return `
            <div class="fx-header">
                <div class="fx-avatar">
                    <img src="https://i.ibb.co/GfPnk0zV/preview.webp" alt="Fixology">
                </div>
                <div class="fx-info">
                    <div class="fx-title">Fixology Diagnostic Assistant</div>
                    <div class="fx-subtitle">
                        <span class="fx-status-dot"></span>
                        Online
                    </div>
                </div>
                <button class="fx-close" id="fx-close" aria-label="Close chat">×</button>
            </div>
            <div class="fx-messages" id="fx-messages">
                ${buildWelcomeHTML()}
            </div>
            <div class="fx-input-area">
                <div class="fx-input-row">
                    <div class="fx-input-wrapper">
                        <textarea 
                            class="fx-input" 
                            id="fx-input" 
                            placeholder="Describe your device issue or enter an IMEI..."
                            rows="1"
                        ></textarea>
                    </div>
                    <button class="fx-send" id="fx-send" aria-label="Send message">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="fx-footer">
                Powered by <a href="https://fixologyai.com" target="_blank">Fixology Intelligence</a>
            </div>
        `;
    }
    
    function buildWelcomeHTML() {
        return `
            <div class="fx-welcome" id="fx-welcome">
                <div class="fx-welcome-icon">🔧</div>
                <div class="fx-welcome-title">Hi, I'm Fixology AI</div>
                <div class="fx-welcome-desc">
                    I can diagnose devices, run IMEI checks, and answer questions about your repair needs.
                </div>
                <div class="fx-starters">
                    <button class="fx-starter" data-message="I need help diagnosing a device issue">
                        <span class="fx-starter-icon">📱</span>
                        <span>Diagnose my device</span>
                    </button>
                    <button class="fx-starter" data-message="I want to check an IMEI number">
                        <span class="fx-starter-icon">🔍</span>
                        <span>Check an IMEI</span>
                    </button>
                    <button class="fx-starter" data-message="What are Fixology's pricing plans?">
                        <span class="fx-starter-icon">💰</span>
                        <span>Ask about pricing</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    function formatMessage(text) {
        // Convert markdown-like formatting to HTML
        return text
            // Bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Bullet points
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            // Numbered lists
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            // Wrap consecutive list items in ul
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            // Line breaks to paragraphs
            .split('\n\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')
            // Single line breaks
            .replace(/\n/g, '<br>');
    }
    
    function buildMessageHTML(role, content, meta) {
        let html = `<div class="fx-msg ${role}">${formatMessage(content)}`;
        
        // Add IMEI badge if present
        if (meta?.imei?.status && role === 'assistant') {
            const status = meta.imei.status;
            const badgeText = status === 'clean' ? 'Device Clean' : 
                             status === 'warning' ? 'Caution' : 'Flagged';
            html = `<div class="fx-imei-badge ${status}">${badgeText}</div>` + html;
        }
        
        // Add suggested actions
        if (meta?.suggestedActions?.length && role === 'assistant') {
            html += '<div class="fx-actions">';
            meta.suggestedActions.slice(0, 3).forEach(action => {
                html += `<button class="fx-action-btn" data-action="${action}">${action}</button>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }
    
    function buildTypingHTML() {
        return `
            <div class="fx-typing" id="fx-typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
    }
    
    function buildErrorHTML(message) {
        return `
            <div class="fx-error">
                ${message}
                <div style="margin-top:12px;font-size:12px;opacity:0.8">
                    Can't chat? Email us at <a href="mailto:repair@fixologyai.com" style="color:#A78BFA">repair@fixologyai.com</a>
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════════
    // API COMMUNICATION
    // ═══════════════════════════════════════════════════════════════
    
    async function sendMessage(userMessage) {
        if (isLoading || !userMessage.trim()) return;
        
        isLoading = true;
        const messagesContainer = document.getElementById('fx-messages');
        const input = document.getElementById('fx-input');
        const sendBtn = document.getElementById('fx-send');
        
        // Remove welcome screen if present
        const welcome = document.getElementById('fx-welcome');
        if (welcome) {
            welcome.remove();
        }
        
        // Add user message to UI
        messages.push({ role: 'user', content: userMessage });
        messagesContainer.insertAdjacentHTML('beforeend', buildMessageHTML('user', userMessage));
        
        // Clear input and disable
        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;
        autoResizeInput(input);
        
        // Show typing indicator
        messagesContainer.insertAdjacentHTML('beforeend', buildTypingHTML());
        scrollToBottom();
        
        try {
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: CONFIG.sessionId,
                    role: CONFIG.role,
                    messages: messages
                })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            const typing = document.getElementById('fx-typing');
            if (typing) typing.remove();
            
            if (data.success) {
                // Add assistant message
                messages.push({ role: 'assistant', content: data.reply });
                messagesContainer.insertAdjacentHTML('beforeend', 
                    buildMessageHTML('assistant', data.reply, data.meta)
                );
                
                // Attach action button handlers
                attachActionHandlers();
                
                console.log('[Fixology] Intent:', data.intent, 'Meta:', data.meta);
            } else {
                // Show error
                messagesContainer.insertAdjacentHTML('beforeend', 
                    buildErrorHTML('Something went wrong on our side. Please try again in a moment.')
                );
                console.error('[Fixology] API Error:', data.error, data.debug);
            }
            
        } catch (err) {
            // Remove typing indicator
            const typing = document.getElementById('fx-typing');
            if (typing) typing.remove();
            
            // Show error
            messagesContainer.insertAdjacentHTML('beforeend', 
                buildErrorHTML('Unable to connect. Please check your connection and try again.')
            );
            console.error('[Fixology] Network Error:', err);
        } finally {
            isLoading = false;
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
            scrollToBottom();
        }
    }
    
    function attachActionHandlers() {
        document.querySelectorAll('.fx-action-btn').forEach(btn => {
            if (!btn.hasAttribute('data-attached')) {
                btn.setAttribute('data-attached', 'true');
                btn.addEventListener('click', () => {
                    sendMessage(btn.getAttribute('data-action'));
                });
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════════════════════════
    
    function scrollToBottom() {
        const container = document.getElementById('fx-messages');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }
    
    function autoResizeInput(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    function togglePanel() {
        const panel = document.getElementById('fixology-chat-panel');
        const btn = document.getElementById('fixology-widget-btn');
        
        isOpen = !isOpen;
        
        if (isOpen) {
            panel.classList.add('open');
            btn.classList.remove('has-unread');
            document.getElementById('fx-input')?.focus();
        } else {
            panel.classList.remove('open');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════
    
    function init() {
        // Inject styles
        const styleEl = document.createElement('style');
        styleEl.id = 'fixology-widget-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
        
        // Create widget button
        const btn = document.createElement('button');
        btn.id = 'fixology-widget-btn';
        btn.innerHTML = '<img src="https://i.ibb.co/GfPnk0zV/preview.webp" alt="Fixology AI">';
        btn.setAttribute('aria-label', 'Open Fixology chat');
        document.body.appendChild(btn);
        
        // Create chat panel
        const panel = document.createElement('div');
        panel.id = 'fixology-chat-panel';
        panel.innerHTML = buildWidgetHTML();
        document.body.appendChild(panel);
        
        // Event Listeners
        btn.addEventListener('click', togglePanel);
        
        document.getElementById('fx-close').addEventListener('click', togglePanel);
        
        const input = document.getElementById('fx-input');
        const sendBtn = document.getElementById('fx-send');
        
        sendBtn.addEventListener('click', () => {
            sendMessage(input.value.trim());
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input.value.trim());
            }
        });
        
        input.addEventListener('input', () => {
            autoResizeInput(input);
        });
        
        // Starter buttons
        document.querySelectorAll('.fx-starter').forEach(starter => {
            starter.addEventListener('click', () => {
                const message = starter.getAttribute('data-message');
                if (message) {
                    sendMessage(message);
                }
            });
        });
        
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                togglePanel();
            }
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('fixology-chat-panel');
            const btn = document.getElementById('fixology-widget-btn');
            
            if (isOpen && 
                !panel.contains(e.target) && 
                !btn.contains(e.target)) {
                togglePanel();
            }
        });
        
        console.log('[Fixology] Chat widget initialized', {
            endpoint: CONFIG.apiEndpoint,
            role: CONFIG.role,
            sessionId: CONFIG.sessionId
        });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GLOBAL API (for programmatic control)
    // ═══════════════════════════════════════════════════════════════
    
    window.FixologyChat = {
        open: () => {
            if (!isOpen) togglePanel();
        },
        close: () => {
            if (isOpen) togglePanel();
        },
        toggle: togglePanel,
        send: sendMessage,
        setRole: (role) => {
            CONFIG.role = role;
        },
        getMessages: () => [...messages],
        clearMessages: () => {
            messages = [];
            const container = document.getElementById('fx-messages');
            if (container) {
                container.innerHTML = buildWelcomeHTML();
                // Re-attach starter handlers
                document.querySelectorAll('.fx-starter').forEach(starter => {
                    starter.addEventListener('click', () => {
                        const message = starter.getAttribute('data-message');
                        if (message) sendMessage(message);
                    });
                });
            }
        }
    };
    
    // Also expose legacy API for backward compatibility
    window.fxToggle = togglePanel;
    window.fxSend = sendMessage;

    // ═══════════════════════════════════════════════════════════════
    // BOOT
    // ═══════════════════════════════════════════════════════════════
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
