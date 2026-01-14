'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/mobile-nav';
import { FixoProvider, FixoWidget } from '@/components/fixo/fixo-chat-widget';

const heroDemoScenarios = [
  { message: 'iphone 14 pro keeps restarting, no water damage, battery drains fast', issue: 'Battery health problem', pct: 85, explanation: "Battery can't hold power during normal use", repair: 'Battery test + replacement', time: '30–45 min', price: '$69–79' },
  { message: 'galaxy s23 green lines on screen getting worse', issue: 'Screen panel failure', pct: 91, explanation: 'OLED display pixels are degrading', repair: 'Screen replacement', time: '45–60 min', price: '$189–229' },
  { message: 'iphone 13 wont charge tried different cables', issue: 'Charging port damage', pct: 78, explanation: 'Port contacts worn or debris blocking connection', repair: 'Port cleaning + replacement', time: '30 min', price: '$89–119' },
  { message: 'ps5 turns on then shuts off after 30 seconds', issue: 'Overheating protection', pct: 82, explanation: 'Thermal paste dried out, console protecting itself', repair: 'Thermal paste replacement', time: '60 min', price: '$89–179' },
  { message: 'ipad pro screen flickering when i touch it', issue: 'Touch controller issue', pct: 73, explanation: 'Digitizer connection loose or damaged', repair: 'Screen + digitizer replacement', time: '45 min', price: '$249–299' },
  { message: 'macbook pro screen goes black but still works', issue: 'Display backlight failure', pct: 88, explanation: 'Backlight LED strip burned out', repair: 'Backlight repair', time: '60–90 min', price: '$149–199' },
  { message: 'iphone 12 camera blurry wont focus', issue: 'Camera module failure', pct: 76, explanation: 'Autofocus mechanism stuck or damaged', repair: 'Camera module replacement', time: '30 min', price: '$79–99' },
  { message: 'xbox series x makes loud fan noise then crashes', issue: 'Fan bearing failure', pct: 84, explanation: 'Cooling fan bearings worn, causing overheating', repair: 'Fan replacement', time: '45 min', price: '$69–89' },
  { message: 'samsung phone screen cracked but touch works', issue: 'Glass only damage', pct: 92, explanation: 'Outer glass broken, digitizer intact', repair: 'Glass replacement', time: '30 min', price: '$129–169' },
  { message: 'iphone 11 speaker sounds muffled and quiet', issue: 'Speaker blockage', pct: 71, explanation: 'Debris or moisture blocking speaker grille', repair: 'Speaker cleaning + replacement', time: '20 min', price: '$49–69' },
  { message: 'nintendo switch joycon drifts to the left', issue: 'Joystick drift', pct: 89, explanation: 'Analog stick potentiometer worn', repair: 'Joystick replacement', time: '30 min', price: '$39–59' },
  { message: 'iphone 14 pro max back glass shattered', issue: 'Rear glass damage', pct: 95, explanation: 'Back panel glass cracked from impact', repair: 'Back glass replacement', time: '45 min', price: '$149–199' },
  { message: 'laptop keyboard some keys not working', issue: 'Keyboard ribbon damage', pct: 67, explanation: 'Keyboard flex cable loose or damaged', repair: 'Keyboard replacement', time: '45 min', price: '$89–129' },
  { message: 'iphone 13 mini battery dies in 2 hours', issue: 'Severe battery degradation', pct: 91, explanation: 'Battery capacity below 60%, needs replacement', repair: 'Battery replacement', time: '30 min', price: '$69–79' },
  { message: 'airpods pro right earbud no sound', issue: 'Driver failure', pct: 74, explanation: 'Speaker driver damaged or disconnected', repair: 'Earbud repair', time: '20 min', price: '$59–79' },
  { message: 'ipad air screen unresponsive to touch', issue: 'Digitizer failure', pct: 81, explanation: 'Touch sensor layer damaged', repair: 'Digitizer replacement', time: '45 min', price: '$149–189' },
  { message: 'iphone se water damage wont turn on', issue: 'Liquid damage', pct: 68, explanation: 'Moisture shorted internal components', repair: 'Liquid damage repair', time: '90 min', price: '$149–249' },
  { message: 'galaxy watch screen black but vibrates', issue: 'Display connection issue', pct: 77, explanation: 'Display ribbon cable loose', repair: 'Display repair', time: '30 min', price: '$79–119' },
  { message: 'iphone 12 pro max camera lens cracked', issue: 'Camera lens damage', pct: 93, explanation: 'Outer camera lens glass broken', repair: 'Lens replacement', time: '20 min', price: '$49–69' },
  { message: 'macbook air trackpad clicks but no cursor', issue: 'Trackpad failure', pct: 72, explanation: 'Trackpad sensor malfunctioning', repair: 'Trackpad replacement', time: '60 min', price: '$129–179' },
  { message: 'iphone xr screen has purple tint', issue: 'Display panel issue', pct: 79, explanation: 'LCD panel color degradation', repair: 'Screen replacement', time: '30 min', price: '$99–129' },
  { message: 'ps4 controller buttons stick when pressed', issue: 'Button mechanism damage', pct: 66, explanation: 'Button contacts dirty or worn', repair: 'Button cleaning + replacement', time: '30 min', price: '$39–59' },
  { message: 'iphone 14 plus charging port loose', issue: 'Port connector damage', pct: 85, explanation: 'Charging port connector loose or damaged', repair: 'Port replacement', time: '30 min', price: '$89–119' },
  { message: 'ipad pro apple pencil not connecting', issue: 'Pencil charging issue', pct: 58, explanation: 'Pencil battery dead or charging contacts dirty', repair: 'Pencil repair', time: '20 min', price: '$49–69' },
  { message: 'samsung phone overheating during calls', issue: 'Thermal management failure', pct: 73, explanation: 'Thermal paste degraded or fan blocked', repair: 'Thermal service', time: '45 min', price: '$79–99' },
  { message: 'iphone 13 pro max face id not working', issue: 'Face ID sensor failure', pct: 76, explanation: 'TrueDepth camera module damaged', repair: 'Face ID repair', time: '45 min', price: '$149–199' },
  { message: 'macbook pro keyboard backlight not working', issue: 'Backlight LED failure', pct: 64, explanation: 'Keyboard backlight LEDs burned out', repair: 'Keyboard replacement', time: '60 min', price: '$129–179' },
  { message: 'iphone 11 pro camera wont open app crashes', issue: 'Camera module disconnect', pct: 81, explanation: 'Camera flex cable loose or damaged', repair: 'Camera repair', time: '30 min', price: '$89–119' },
  { message: 'nintendo switch screen has dead pixels', issue: 'LCD panel damage', pct: 87, explanation: 'LCD panel has permanent pixel damage', repair: 'Screen replacement', time: '45 min', price: '$79–99' },
  { message: 'airpods max one side no audio', issue: 'Driver failure', pct: 75, explanation: 'Headphone driver damaged', repair: 'Driver replacement', time: '30 min', price: '$89–119' },
  { message: 'iphone 12 mini speaker crackling sound', issue: 'Speaker damage', pct: 70, explanation: 'Speaker coil damaged or debris inside', repair: 'Speaker replacement', time: '20 min', price: '$49–69' },
  { message: 'ipad mini charging very slowly', issue: 'Charging circuit issue', pct: 69, explanation: 'Charging IC or port damaged', repair: 'Charging port repair', time: '30 min', price: '$79–99' }
];

const dxData = [
  {
    device: "iPhone 14 Pro", deviceEmoji: "📱",
    customerSays: "My phone keeps restarting on its own, sometimes every few minutes. It wasn't dropped or exposed to water.",
    systemNotices: "Random shutdown pattern detected. No physical damage indicators. Behavior consistent with power delivery issues.",
    causes: [
      { headline: "Battery can't hold power during normal use", explanation: "The battery struggles to deliver consistent power when the phone is working hard", confidence: "Seen frequently on devices 2+ years old", pct: 85, lvl: "h" },
      { headline: "Software became unstable after an update", explanation: "A recent iOS update may not have installed correctly", confidence: "Common after interrupted updates", pct: 55, lvl: "m" },
      { headline: "Internal connection issue on motherboard", explanation: "A tiny connection inside came loose", confidence: "Less likely without drop history", pct: 12, lvl: "l" }
    ],
    est: { price: "$69 – $79", time: "30 min", repair: "Battery Replacement" }
  },
  {
    device: "Samsung Galaxy S23", deviceEmoji: "📱",
    customerSays: "There are green lines on the right side of my screen. They started small but now cover more area.",
    systemNotices: "Progressive display artifact pattern. Vertical line formation typical of panel degradation.",
    causes: [
      { headline: "Screen pixels are failing in that area", explanation: "The OLED display material is breaking down", confidence: "Very common on OLED screens over time", pct: 91, lvl: "h" },
      { headline: "Display cable is partially disconnected", explanation: "The ribbon cable may have come loose", confidence: "Sometimes happens after repairs", pct: 38, lvl: "m" },
      { headline: "Graphics processor issue", explanation: "The chip that controls the display may be malfunctioning", confidence: "Rare without other symptoms", pct: 8, lvl: "l" }
    ],
    est: { price: "$189 – $229", time: "45 min", repair: "Screen Replacement" }
  },
  {
    device: "PlayStation 5", deviceEmoji: "🎮",
    customerSays: "It turns on, the blue light blinks, then it shuts off after about 30 seconds. Nothing shows on the TV.",
    systemNotices: "Boot sequence initiates but fails before video output. Thermal protection pattern detected.",
    causes: [
      { headline: "Console is overheating immediately", explanation: "The thermal paste dried out, so it shuts down to protect itself", confidence: "Extremely common on PS5s 2+ years old", pct: 82, lvl: "h" },
      { headline: "HDMI output chip is damaged", explanation: "The chip that sends video to your TV isn't working", confidence: "Often caused by cable yanking", pct: 34, lvl: "m" },
      { headline: "Power supply can't sustain the load", explanation: "The power unit works briefly but can't keep up", confidence: "Less common on newer units", pct: 18, lvl: "l" }
    ],
    est: { price: "$89 – $179", time: "60 min", repair: "Thermal Service" }
  }
];

const tkData = [
  { input: "Jason Terrance 3142871845 14 pro max screen cracked dropped on puddle", customer: "Jason Terrance", phone: "(314) 287-1845", device: "iPhone 14 Pro Max", repair: "Screen Replacement", note: "Dropped on puddle. Screen cracked.", tech: "Mike T.", id: "FIX-4271" },
  { input: "Maria Santos 5551234567 galaxy s22 ultra not charging tried different cables", customer: "Maria Santos", phone: "(555) 123-4567", device: "Galaxy S22 Ultra", repair: "Charging Port Diagnosis", note: "Not charging. Multiple cables tested.", tech: "James L.", id: "FIX-4272" }
];

const imeiData = [
  { imei: "353912104582716", device: "iPhone 14 Pro Max", storage: "256GB", color: "Deep Purple", carrier: "Unlocked", fmi: "OFF", blacklist: "Clean", warranty: "Expired", simlock: "Unlocked" },
  { imei: "351892107264583", device: "iPhone 13 Pro", storage: "128GB", color: "Sierra Blue", carrier: "AT&T", fmi: "ON", blacklist: "Clean", warranty: "Expired", simlock: "Locked" }
];

const repairSteps = [
  { step: 1, title: "Power down and remove SIM", time: "1 min", warning: null },
  { step: 2, title: "Remove pentalobe screws (x2)", time: "1 min", warning: "Keep screws organized" },
  { step: 3, title: "Apply heat to soften adhesive", time: "3 min", warning: "Do not exceed 80°C" },
  { step: 4, title: "Insert pick and release clips", time: "5 min", warning: "Avoid Face ID area" },
  { step: 5, title: "Disconnect battery first", time: "1 min", warning: "Always disconnect battery before display" },
  { step: 6, title: "Transfer components to new display", time: "8 min", warning: "Handle earpiece flex carefully" }
];

const pricingBreakdown = { repair: "iPhone 14 Pro Max Screen", parts: 189, labor: 45, warranty: 15, total: 249, competitor: 329, reasoning: "Price reflects genuine-quality OLED, professional installation, and full warranty." };

const communicationMessages = [
  { time: "10:32 AM", message: "Device received and checked in. Beginning diagnosis now.", status: "Intake Complete" },
  { time: "11:15 AM", message: "Found the issue: Battery can't hold charge. Replacement recommended. Cost: $79. Reply YES to approve.", status: "Awaiting Approval" },
  { time: "11:18 AM", message: "Thank you! Repair in progress. We'll notify you when ready.", status: "In Repair" },
  { time: "12:45 PM", message: "Great news! Your iPhone 14 Pro is ready for pickup. Total: $79.", status: "Ready" }
];

const communicationMessageSets = [
  [
    { time: "10:32 AM", message: "We've received your device and started diagnostics.", status: "Intake Complete" },
    { time: "11:15 AM", message: "Issue confirmed. Waiting on your approval.", status: "Awaiting Approval" },
    { time: "11:18 AM", message: "Repair approved. Work in progress.", status: "In Repair" },
    { time: "12:45 PM", message: "Repair completed. Ready for pickup.", status: "Ready" }
  ],
  [
    { time: "2:15 PM", message: "Device checked in. Running diagnostics now.", status: "Intake Complete" },
    { time: "2:48 PM", message: "Diagnosis complete. Battery replacement needed. $89. Reply YES to proceed.", status: "Awaiting Approval" },
    { time: "2:52 PM", message: "Customer just approved the repair.", status: "In Repair" },
    { time: "4:20 PM", message: "Repair finished. Device ready for pickup. Total: $89.", status: "Ready" }
  ],
  [
    { time: "9:10 AM", message: "Your device arrived. Starting analysis.", status: "Intake Complete" },
    { time: "9:45 AM", message: "Screen replacement required. $199. Approve to continue.", status: "Awaiting Approval" },
    { time: "9:47 AM", message: "Approval received. Repair in progress.", status: "In Repair" },
    { time: "11:30 AM", message: "All done! Your device is ready. Total: $199.", status: "Ready" }
  ]
];

const riskAlerts = [
  { severity: "high", device: "iPhone 14 Pro", issue: "Repeat customer flagged (3 prior battery replacements)", recommendation: "This device has caused repeat issues before. Consider warranty discussion." },
  { severity: "high", device: "Samsung S23", issue: "Blacklisted IMEI detected", recommendation: "Do not repair. Return device to customer immediately." },
  { severity: "medium", device: "iPhone 12", issue: "Liquid exposure risk based on symptoms", recommendation: "Customer reported no water damage, but symptoms suggest liquid. Proceed with caution." },
  { severity: "medium", device: "PS5", issue: "Same customer, 3rd repair in 6 months", recommendation: "Suggest case + screen protector bundle to prevent future damage." },
  { severity: "low", device: "Galaxy S22", issue: "Charging port repairs up 40% this month", recommendation: "Check supplier quality for replacement ports." }
];

const comparisonRows = [
  { feature: 'Intake speed', traditional: '4-5 minutes', fixology: '40 seconds' },
  { feature: 'Risk detection', traditional: 'Manual checks', fixology: 'Automatic IMEI + pattern alerts' },
  { feature: 'Customer updates', traditional: 'Manual texts/calls', fixology: 'Auto-generated, tone-aware' },
  { feature: 'Inventory intelligence', traditional: 'Basic tracking', fixology: 'Usage patterns + reorder suggestions' },
  { feature: 'Diagnostic guidance', traditional: 'Tech experience only', fixology: 'AI-powered step-by-step' },
  { feature: 'Pricing confidence', traditional: 'Guesswork', fixology: 'Market comparison + breakdown' },
]

const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
section[id]{scroll-margin-top:120px}
body{font-family:'Poppins',sans-serif;background:#0f0a1a;min-height:100vh;overflow-x:hidden;color:#EDE9FE}
.bg-structure{position:fixed;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 50% 50%,#1a0f2e 0%,#0f0a1a 100%);z-index:-1}
.bg-grid{position:absolute;top:0;left:0;right:0;bottom:0;background:none;z-index:-1}
.vertical-rail{position:fixed;top:0;bottom:0;width:1px;background:linear-gradient(to bottom,transparent,rgba(167,139,250,0.08),transparent);z-index:1;pointer-events:none}
.vertical-rail.left{left:clamp(20px, 5vw, 80px)}
.vertical-rail.right{right:clamp(20px, 5vw, 80px)}
.wide-container{max-width:1600px;margin:0 auto;width:100%;padding:0 clamp(24px, 8vw, 120px);position:relative;z-index:2}
.text-constraint{max-width:840px;margin-left:0;margin-right:auto}
.text-constraint-center{max-width:840px;margin-left:auto;margin-right:auto}
.breakout-panel{width:100vw;margin-left:calc(-1 * clamp(24px, 8vw, 120px));margin-right:calc(-1 * clamp(24px, 8vw, 120px));position:relative}
.asymmetric-layout{display:grid;grid-template-columns:1fr 1.2fr;gap:80px;align-items:center}
@media(max-width:1100px){.asymmetric-layout{grid-template-columns:1fr;gap:40px}}
.section-spacer{padding:160px 0}
@media(max-width:768px){.section-spacer{padding:80px 0}}
.wide-container.mobile-pad{padding:0 16px}
@media(max-width:768px){
  .wide-container{padding:0 16px}
  /* Desktop nav - FORCE HIDE */
  header:not(.mobile-header), [data-marketing-desktop-nav] { display: none !important; }

  /* Asymmetric - FORCE SINGLE COLUMN (overrides inline gridTemplateColumns) */
  .asymmetric-layout { grid-template-columns: 1fr !important; }

  .asymmetric-layout{gap:24px}
  .section-spacer{padding:72px 0}
  .vertical-rail{display:none!important}
  .section-title{text-align:center!important}
  .text-constraint{text-align:center!important}
  .text-constraint p{margin-left:auto!important;margin-right:auto!important}
  .narrow-wrap{padding-left:16px!important;padding-right:16px!important}
  .header-cta,.header-ghost{width:100%;justify-content:center}
  .glow-button{width:100%;text-align:center}
  .hero-title{text-align:center!important}
  .hero-sub{text-align:center!important}
  .hero-bullets{align-items:center}
  .hero-bullets div{justify-content:center}
  .hero-actions{flex-direction:column!important;align-items:stretch!important;justify-content:center!important}
  .hero-icons{justify-content:center}
  .nav-link,.nav-link-ai{font-size:14px;padding:8px 10px;line-height:1.3}
  .nav-group,.nav-links{flex-wrap:wrap;gap:8px;justify-content:center}
  header .wide-container{padding:0 12px}
  .glass-card, .breakout-panel, .asymmetric-layout > * {max-width:100%; overflow:hidden}
  .floating, .floating-d1, .floating-d2{display:none!important}
  .desktop-nav, [data-marketing-desktop-nav]{display:none!important}
  /* Extra safety: don't allow the legacy desktop menu items to render on mobile at all. */
  .nav-center,.login-link,.trust-pill,.header-cta,.header-ghost{display:none!important}

  /* How-it-works: turn the horizontal flow into a vertical stepper on mobile. */
  .how-steps{display:grid!important;grid-template-columns:1fr!important;gap:14px!important;padding:0!important}
  .how-step{flex:none!important;align-items:flex-start!important;text-align:left!important}
  .how-step > div:first-child{width:44px!important;height:44px!important;font-size:18px!important}
  .how-connector{display:none!important}

  /* Outcomes: 2x2 grid on mobile */
  .outcomes-grid{grid-template-columns:repeat(2,1fr)!important;gap:16px!important}

  /* Demos: remove heavy 3D transforms and let content grow vertically. */
  .demo-container{min-height:auto!important;max-height:none!important;height:auto!important;transform:none!important}
  .demo-split{grid-template-columns:1fr!important;height:auto!important;min-height:auto!important}
  .demo-split > div{border-right:none!important}
  .demo-fields-grid{grid-template-columns:1fr!important}

  /* IMEI: prevent truncation of the scanned number + stack the report grid. */
  .imei-number{font-size:20px!important;letter-spacing:.04em!important;overflow-wrap:anywhere!important;word-break:break-word!important}
  .imei-report-grid{grid-template-columns:1fr!important}

  /* Inventory: allow the desktop grid table to scroll if it appears. */
  .inv-table-scroll{overflow-x:auto!important;-webkit-overflow-scrolling:touch}
  .inv-grid-row{min-width:680px}

  /* Contact form: stack the first row */
  .contact-two-col{grid-template-columns:1fr!important}

  /* =====================================================
     Mobile “box” system: consistent, readable, aesthetic
     ===================================================== */
  .glass-card,
  .ticker-field,
  .step-card,
  .alert-card {
    border-radius: 18px !important;
  }

  /* Make all “boxes” feel like the same design family on mobile */
  .ticker-field,
  .step-card,
  .alert-card {
    background: rgba(15, 10, 26, 0.70) !important;
    border: 1px solid rgba(167, 139, 250, 0.18) !important;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.30);
  }

  /* Slightly stronger, cleaner surface for primary cards */
  .glass-card {
    background: linear-gradient(
      135deg,
      rgba(167, 139, 250, 0.10) 0%,
      rgba(15, 10, 26, 0.92) 55%,
      rgba(15, 10, 26, 0.84) 100%
    ) !important;
    border: 1px solid rgba(167, 139, 250, 0.20) !important;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.38);
  }

  /* Consistent padding rhythm + reduce “giant” cards on mobile */
  .glass-card:not(.demo-container){padding:22px!important}
  .glass-card.demo-container{padding:18px!important}

  /* Bridge text should feel like a gentle divider, not a huge block */
  .bridge-text{padding:28px 16px!important;font-size:14px!important;line-height:1.6!important;opacity:.9!important}

  /* Pricing: remove featured scale + make it read cleanly */
  .pricing-card-featured{transform:none!important}
  .pricing-explain-grid{grid-template-columns:1fr!important;gap:16px!important}
  .pricing-savings{padding:18px!important}

  /* Customer updates: consistent bubble styling */
  .msg-bubble{
    padding:14px!important;
    border-radius:16px!important;
    background: rgba(15,10,26,.72)!important;
    border: 1px solid rgba(167,139,250,.18)!important;
  }
  .msg-meta{padding:0 2px!important;font-size:11px!important}

  /* Authority grid: stack on mobile */
  .authority-grid{grid-template-columns:1fr!important}

  /* Customer updates - ensure bubbles never truncate */
  .msg-bubble, .msg-bubble p, .msg-bubble span {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  /* Auth pages: mobile-friendly stacking and full-width cards */
  .auth-grid{grid-template-columns:1fr!important;gap:18px!important}
  .auth-card{max-width:100%!important;width:100%!important;padding:20px!important;margin:0!important}
  .auth-side{display:none!important}

  /* Typography: readable sizes + no truncation */
  .glass-card p,
  .ticker-field p,
  .step-card p,
  .alert-card p,
  .glass-card span,
  .ticker-field span,
  .step-card span,
  .alert-card span,
  .glass-card div,
  .ticker-field div,
  .step-card div,
  .alert-card div {
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .glass-card p,
  .ticker-field p,
  .step-card p,
  .alert-card p {
    font-size: 14px !important;
    line-height: 1.7 !important;
    color: rgba(237, 233, 254, 0.86) !important;
  }

  /* Compact headings inside boxes */
  .glass-card h2,
  .glass-card h3 {
    line-height: 1.2 !important;
  }

  /* Ensure flex children can shrink instead of clipping */
  .glass-card * { min-width: 0; }
}
.glow-spot{position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(167,139,250,0.08) 0%,transparent 70%);filter:blur(80px);pointer-events:none;z-index:0}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes breathe{0%,100%{box-shadow:0 0 20px rgba(167,139,250,.2)}50%{box-shadow:0 0 35px rgba(167,139,250,.4)}}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
@keyframes gradient{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes progressGrow{from{width:0}}
@keyframes thinkingDots{0%,20%{opacity:.3}50%{opacity:1}80%,100%{opacity:.3}}
@keyframes scanLine{0%{top:0;opacity:0}50%{opacity:.8}100%{top:100%;opacity:0}}
.floating{animation:float 8s ease-in-out infinite}
.floating-d1{animation:float 10s ease-in-out infinite;animation-delay:1.5s}
.floating-d2{animation:float 12s ease-in-out infinite;animation-delay:3s}
.glass-card{background:linear-gradient(135deg,rgba(167,139,250,.08) 0%,rgba(15,10,26,.9) 100%);backdrop-filter:blur(20px);border:1px solid rgba(167,139,250,.15);border-radius:24px;transition:all .4s ease}
.glass-card:hover{border-color:rgba(167,139,250,.3);box-shadow:0 20px 60px rgba(167,139,250,.15);transform:translateY(-4px)}
.glass-card-active{animation:breathe 3s ease-in-out infinite}
.glow-button{background:linear-gradient(135deg,#a78bfa 0%,#c4b5fd 50%,#a78bfa 100%);background-size:200% 200%;animation:gradient 3s ease infinite;border:none;border-radius:16px;padding:16px 36px;font-size:16px;font-weight:600;color:#0f0a1a;cursor:pointer;transition:all .3s ease;box-shadow:0 4px 20px rgba(167,139,250,.4)}
.glow-button:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 8px 40px rgba(167,139,250,.6)}
.glow-button-secondary{background:transparent;border:2px solid rgba(167,139,250,.5);color:#c4b5fd;box-shadow:none}
.glow-button-secondary:hover{background:rgba(167,139,250,.1);border-color:#a78bfa}
.nav-link{color:rgba(196,181,253,.85);text-decoration:none;font-size:15px;font-weight:500;padding:10px 16px;border-radius:10px;transition:all .3s ease;position:relative;line-height:1.5;display:inline-block;vertical-align:middle}
.nav-link:hover{color:#fff;background:rgba(167,139,250,.12)}
.nav-link::after{content:'';position:absolute;bottom:6px;left:50%;width:0;height:2px;background:linear-gradient(90deg,transparent,rgba(167,139,250,.6),transparent);transition:all .3s ease;transform:translateX(-50%)}
.nav-link:hover::after{width:60%}
.nav-link-ai{color:rgba(196,181,253,.9);text-decoration:none;font-size:15px;font-weight:600;padding:10px 16px;border-radius:10px;transition:all .3s ease;position:relative;line-height:1.5;display:inline-block;vertical-align:middle}
.nav-link-ai:hover{color:#fff;background:rgba(167,139,250,.16)}
.nav-link-ai::after{content:'';position:absolute;bottom:6px;left:50%;width:0;height:2px;background:linear-gradient(90deg,transparent,rgba(74,222,128,.65),transparent);transition:all .3s ease;transform:translateX(-50%)}
.nav-link-ai:hover::after{width:70%}
.nav-link.active{color:#fff;background:rgba(167,139,250,.12)}
.login-link{color:rgba(196,181,253,.7);text-decoration:none;font-size:14px;font-weight:500;padding:10px 16px;transition:all .3s ease}
.login-link:hover{color:#fff}
.header-cta{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;white-space:nowrap;background:linear-gradient(135deg,#a78bfa 0%,#c4b5fd 50%,#a78bfa 100%);background-size:200% 200%;animation:gradient 3s ease infinite;border:none;border-radius:12px;padding:10px 24px;font-size:14px;font-weight:600;color:#0f0a1a;cursor:pointer;transition:all .3s ease;box-shadow:0 4px 20px rgba(167,139,250,.35)}
.header-cta:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(167,139,250,.5)}
.header-ghost{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;white-space:nowrap;background:transparent;border:1px solid rgba(167,139,250,.3);border-radius:12px;padding:10px 20px;font-size:14px;font-weight:500;color:rgba(196,181,253,.9);cursor:pointer;transition:all .3s ease}
.header-ghost:hover{background:rgba(167,139,250,.1);border-color:rgba(167,139,250,.5);color:#fff}
.nav-group{position:relative;display:inline-flex;align-items:center;vertical-align:middle}
.nav-group::after{content:"";position:absolute;left:0;right:0;top:100%;height:8px}
.nav-dropdown{position:absolute;top:calc(100% + 8px);left:50%;transform:translate(-50%,-8px);background:rgba(15,10,26,.98);backdrop-filter:blur(20px);border:1px solid rgba(167,139,250,.2);border-radius:14px;padding:0;box-shadow:0 18px 50px rgba(0,0,0,.45);opacity:0;visibility:hidden;transition:opacity .18s ease,transform .18s ease,visibility .18s ease;z-index:1000;pointer-events:none;max-height:320px;overflow-y:auto;overflow-x:hidden}
.nav-dropdown::-webkit-scrollbar{width:4px}
.nav-dropdown::-webkit-scrollbar-track{background:transparent}
.nav-dropdown::-webkit-scrollbar-thumb{background:rgba(167,139,250,.2);border-radius:2px}
.nav-dropdown::-webkit-scrollbar-thumb:hover{background:rgba(167,139,250,.3)}
.nav-group:hover .nav-dropdown{opacity:1;visibility:visible;transform:translate(-50%,0);pointer-events:auto}
.dropdown-header{font-size:10px;font-weight:700;color:rgba(167,139,250,.6);text-transform:uppercase;letter-spacing:.1em;padding:12px 16px 8px;border-bottom:1px solid rgba(167,139,250,.1)}
.nav-dropdown-how-it-works{width:320px;max-width:320px;padding:0}
.nav-dropdown-how-it-works .dropdown-item{padding:12px 16px;border-radius:0;border-bottom:1px solid rgba(167,139,250,.05);display:block;color:rgba(196,181,253,.85);text-decoration:none;font-size:14px;transition:background .18s ease,color .18s ease}
.nav-dropdown-how-it-works .dropdown-item:last-child{border-bottom:none}
.nav-dropdown-how-it-works .dropdown-item:hover{background:rgba(167,139,250,.08);color:#fff}
.nav-dropdown-tools{width:520px;max-width:520px;padding:0}
.nav-dropdown-tools .dropdown-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:8px}
.nav-dropdown-tools .dropdown-item{padding:12px 14px;border-radius:8px;background:rgba(167,139,250,.04);border:1px solid rgba(167,139,250,.10);display:flex;flex-direction:column;gap:2px;color:rgba(196,181,253,.85);text-decoration:none;font-size:14px;transition:background .18s ease,border-color .18s ease,color .18s ease;margin:4px}
.nav-dropdown-tools .dropdown-item:hover{background:rgba(167,139,250,.10);border-color:rgba(167,139,250,.22);color:#fff}
.nav-dropdown-how-it-works .dropdown-item-title{font-size:14px;font-weight:600;color:#fff;line-height:1.4}
.nav-dropdown-learn{width:320px;max-width:320px;padding:0}
.nav-dropdown-learn .dropdown-item{padding:12px 16px;border-radius:0;border-bottom:1px solid rgba(167,139,250,.05);display:block;color:rgba(196,181,253,.85);text-decoration:none;font-size:14px;transition:background .18s ease,color .18s ease}
.nav-dropdown-learn .dropdown-item:last-child{border-bottom:none}
.nav-dropdown-learn .dropdown-item:hover{background:rgba(167,139,250,.08);color:#fff}
.dropdown-item{display:flex;flex-direction:column;gap:4px;padding:12px 16px;color:rgba(196,181,253,.85);text-decoration:none;font-size:14px;border-radius:10px;transition:background .18s ease,color .18s ease}
.dropdown-item:hover{background:rgba(167,139,250,.12);color:#fff}
.dropdown-item-title{display:block;font-weight:600;color:#fff;line-height:1.3;font-size:14px}
.dropdown-item-subtitle{display:block;font-size:11px;color:#a1a1aa;line-height:1.35;max-width:220px}
.nav-center{justify-content:center;justify-self:center}
.trust-pill{font-size:12px;color:rgba(196,181,253,.8);padding:8px 14px;border:1px solid rgba(167,139,250,.18);background:rgba(167,139,250,.08);border-radius:20px;white-space:nowrap}
@media(max-width:900px){.trust-pill{display:none}.nav-center{display:none}.nav-mobile{display:flex}.nav-right{justify-content:flex-end}}
@media(min-width:901px){.nav-mobile{display:none}}
.header-glow-line{height:1px;background:linear-gradient(90deg,transparent,rgba(167,139,250,.45),transparent);animation:gradient 6s ease infinite;background-size:200% 200%}
section[id]{scroll-margin-top:120px}
.section-title{font-size:clamp(28px,4vw,48px);font-weight:700;background:linear-gradient(135deg,#fff 0%,#c4b5fd 50%,#a78bfa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.2}
.progress-bar{height:6px;background:rgba(167,139,250,.15);border-radius:3px;overflow:hidden}
.progress-fill{height:100%;border-radius:3px;animation:progressGrow 1s ease-out forwards}
.status-dot{width:8px;height:8px;border-radius:50%;animation:pulse 1.5s ease-in-out infinite}
.thinking-dot{width:6px;height:6px;border-radius:50%;background:#a78bfa;animation:thinkingDots 1.4s ease-in-out infinite}
.thinking-dot:nth-child(2){animation-delay:.2s}
.thinking-dot:nth-child(3){animation-delay:.4s}
.orb{position:fixed;border-radius:50%;filter:blur(100px);pointer-events:none;z-index:0}
.demo-container{min-height:480px;max-height:480px;position:relative;overflow:hidden}
.scan-line{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(167,139,250,.6),transparent);animation:scanLine 2s ease-in-out infinite}
.fade-in{animation:fadeSlideUp .6s ease-out forwards}
.bridge-text{text-align:center;padding:60px 20px;font-size:20px;color:#a78bfa;font-style:italic;opacity:.8}
.step-card{padding:16px 20px;background:rgba(15,10,26,.6);border:1px solid rgba(167,139,250,.15);border-radius:12px;transition:all .3s ease}
.step-card:hover{border-color:rgba(167,139,250,.4);transform:translateX(4px)}
.alert-card{padding:16px;border-radius:12px;border-left:4px solid}
.alert-high{background:rgba(239,68,68,.1);border-color:#ef4444}
.alert-medium{background:rgba(251,191,36,.1);border-color:#fbbf24}
.alert-low{background:rgba(74,222,128,.1);border-color:#4ade80}
.ticker-field{background:rgba(15,10,26,.6);border:1px solid rgba(167,139,250,.2);border-radius:12px;padding:12px 16px;transition:all .3s ease}
.ticker-field:hover{border-color:rgba(167,139,250,.4)}
`;

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return isInView;
}

export default function MarketingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const dxRef = useRef<HTMLDivElement>(null);
  const tkRef = useRef<HTMLDivElement>(null);
  const imeiRef = useRef<HTMLDivElement>(null);
  const repairRef = useRef<HTMLDivElement>(null);
  const commRef = useRef<HTMLDivElement>(null);
  const riskRef = useRef<HTMLDivElement>(null);
  const inventoryRef = useRef<HTMLDivElement>(null);

  // Smooth scroll handler for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="#"]') as HTMLAnchorElement;
      if (link && link.hash) {
        e.preventDefault();
        const targetId = link.hash.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          const headerOffset = 120;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  const heroInView = useInView(heroRef);
  const dxInView = useInView(dxRef);
  const tkInView = useInView(tkRef);
  const imeiInView = useInView(imeiRef);
  const repairInView = useInView(repairRef);
  const commInView = useInView(commRef);
  const riskInView = useInView(riskRef);
  const inventoryInView = useInView(inventoryRef);

  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [dxIdx, setDxIdx] = useState(0);
  const [dxInput, setDxInput] = useState('');
  const [dxPhase, setDxPhase] = useState<'typing' | 'analyzing' | 'results'>('typing');
  const [visibleCauses, setVisibleCauses] = useState(0);
  const [heroDemoIdx, setHeroDemoIdx] = useState(0);
  const [heroDemoData, setHeroDemoData] = useState(heroDemoScenarios[0]);

  const [tkIdx, setTkIdx] = useState(0);
  const [tkInput, setTkInput] = useState('');
  const [tkFields, setTkFields] = useState({ customer: '', phone: '', device: '', repair: '', note: '', tech: '', id: '' });
  const [tkSubmitted, setTkSubmitted] = useState(false);

  const [imeiIdx, setImeiIdx] = useState(0);
  const [imeiNum, setImeiNum] = useState('');
  const [imeiResult, setImeiResult] = useState<typeof imeiData[0] | null>(null);
  const [imeiPhase, setImeiPhase] = useState<'typing' | 'querying' | 'results'>('typing');

  const [currentStep, setCurrentStep] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [visibleAlerts, setVisibleAlerts] = useState(0);
  const [commMessageSetIdx, setCommMessageSetIdx] = useState(0);
  const [riskAlertIdx, setRiskAlertIdx] = useState(0);
  const [inventoryStock, setInventoryStock] = useState({ 'IP14PM-OLED-SOFT': 2, 'IP14P-BTY-GEN': 5, 'PS5-HDMI-PORT': 3 });
  const [inventoryAutoReorder, setInventoryAutoReorder] = useState(true);
  const [inventoryOrderPlaced, setInventoryOrderPlaced] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', shopName: '', email: '', phone: '', message: '', honey: '' });
  const [scheduleForm, setScheduleForm] = useState({ name: '', email: '', shopName: '', phone: '', honey: '' });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [roiRepairs, setRoiRepairs] = useState(150);
  const [roiTicket, setRoiTicket] = useState(120);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleFormErrors, setScheduleFormErrors] = useState<{name?: string; phone?: string; email?: string}>({});

  // Phone number formatting
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length === 0) return '';
    if (phoneNumber.length <= 3) return `(${phoneNumber}`;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };
  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccessPhase, setContactSuccessPhase] = useState(0);
  const tickingRef = useRef(false);
  
  // Advance inquiry success phases so UI leaves the loading state
  useEffect(() => {
    if (!contactSuccess) return;
    setContactSuccessPhase(0);
    const phase1 = setTimeout(() => setContactSuccessPhase(1), 900);
    const phase2 = setTimeout(() => setContactSuccessPhase(2), 1800);
    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
    };
  }, [contactSuccess]);
  const [productOpen, setProductOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  

  const typeText = useCallback((text: string, setter: (val: string) => void, speed = 20): Promise<void> => {
    return new Promise((resolve) => {
      let i = 0;
      setter('');
      const interval = setInterval(() => {
        if (i < text.length) { setter(text.slice(0, i + 1)); i++; } 
        else { clearInterval(interval); resolve(); }
      }, speed);
    });
  }, []);

  // Scroll detection for header compression, hero state, and active section
  useEffect(() => {
    const sections = [
      { id: 'demo', ref: heroRef },
      { id: 'outcomes', selector: '#outcomes' },
      { id: 'what-fixology-handles', selector: '#what-fixology-handles' },
      { id: 'inventory', selector: '#inventory' },
      { id: 'insurance-ready', selector: '#insurance-ready' },
      { id: 'diagnosis', ref: dxRef },
      { id: 'ticketing', ref: tkRef },
      { id: 'imei', ref: imeiRef },
      { id: 'guidance', ref: repairRef },
      { id: 'pricing', selector: '#pricing' },
      { id: 'contact', selector: '#contact' },
      { id: 'communication', ref: commRef },
      { id: 'risk', ref: riskRef },
      { id: 'switching', selector: '#switching' },
      { id: 'testimonials', selector: '#testimonials' }
    ];

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        setScrolled(scrollY > 20);
        if (heroRef.current) {
          const heroBottom = heroRef.current.offsetTop + heroRef.current.offsetHeight;
          setPastHero(scrollY > heroBottom - 100);
        }

        // Active section detection
        let current = '';
        for (const section of sections) {
          let element: HTMLElement | null = null;
          if (section.ref) {
            element = section.ref.current;
          } else if (section.selector) {
            element = document.querySelector(section.selector);
          }
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
              current = section.id;
              break;
            }
          }
        }
        setActiveSection(current);

        tickingRef.current = false;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hero demo auto-run on page load and cycle through scenarios
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const runHeroDemo = async (scenario: typeof heroDemoScenarios[0]) => {
      if (!mounted) return;
      
      // Reset state
      setDxInput('');
      setDxPhase('typing');
      setVisibleCauses(0);
      setHeroDemoData(scenario);
      
      // 0-1.5s: Auto-type realistic message fast
      const message = scenario.message;
      for (let i = 0; i <= message.length; i++) {
        if (!mounted) return;
        setDxInput(message.slice(0, i));
        await new Promise(r => setTimeout(r, 20));
      }
      
      // 1.5-2.5s: Immediate hard output - skip analyzing, go straight to results
      if (!mounted) return;
      setDxPhase('results');
      setVisibleCauses(1);
      
      // 2.5-4.0s: Cascade supporting value
      await new Promise(r => setTimeout(r, 400));
      if (!mounted) return;
      setVisibleCauses(2);
      
      await new Promise(r => setTimeout(r, 400));
      if (!mounted) return;
      setVisibleCauses(3);
      
      // Schedule next scenario: random between 8-12 seconds
      if (!mounted) return;
      const nextDelay = 8000 + Math.random() * 4000; // 8-12 seconds
      timeoutId = setTimeout(() => {
        if (!mounted) return;
        const nextIdx = Math.floor(Math.random() * heroDemoScenarios.length);
        setHeroDemoIdx(nextIdx);
      }, nextDelay);
    };
    
    // Start with current scenario index
    runHeroDemo(heroDemoScenarios[heroDemoIdx]);
    
    return () => { 
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [heroDemoIdx]);

  useEffect(() => {
    if (!dxInView) return;
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const run = async () => {
      if (!mounted || !dxInView) return;
      const d = dxData[dxIdx];
      setDxPhase('typing'); 
      setVisibleCauses(0);
      setDxInput('');
      
      // Auto-type customer message fast (2-3 seconds)
      await typeText(d.customerSays, setDxInput, 15);
      if (!mounted || !dxInView) return;
      
      // Immediately show results - no analyzing delay
      setDxPhase('results');
      setVisibleCauses(1);
      
      // Cascade supporting value
      await new Promise(r => setTimeout(r, 400));
      if (!mounted || !dxInView) return;
      setVisibleCauses(2);
      
      await new Promise(r => setTimeout(r, 400));
      if (!mounted || !dxInView) return;
      setVisibleCauses(3);
      
      // Wait before cycling to next message (12-15 seconds total)
      const cycleDelay = 12000 + Math.random() * 3000;
      timeoutId = setTimeout(() => {
        if (!mounted || !dxInView) return;
      setDxIdx((p) => (p + 1) % dxData.length);
      }, cycleDelay);
    };
    
    run();
    return () => { 
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [dxIdx, dxInView, typeText]);

  useEffect(() => {
    if (!tkInView) return;
    let mounted = true;
    const run = async () => {
      const d = tkData[tkIdx];
      setTkFields({ customer: '', phone: '', device: '', repair: '', note: '', tech: '', id: '' }); setTkSubmitted(false);
      await typeText(d.input, setTkInput, 15);
      if (!mounted) return;
      await new Promise(r => setTimeout(r, 400));
      for (const f of ['customer', 'phone', 'device', 'repair', 'note', 'tech', 'id'] as const) { if (!mounted) return; setTkFields(p => ({ ...p, [f]: d[f] })); await new Promise(r => setTimeout(r, 120)); }
      await new Promise(r => setTimeout(r, 500));
      if (!mounted) return; setTkSubmitted(true);
      await new Promise(r => setTimeout(r, 8000));
      if (!mounted) return;
      setTkIdx((p) => (p + 1) % tkData.length);
    };
    run();
    return () => { mounted = false; };
  }, [tkIdx, tkInView, typeText]);

  useEffect(() => {
    if (!imeiInView) return;
    let mounted = true;
    const run = async () => {
      const d = imeiData[imeiIdx];
      setImeiResult(null); setImeiPhase('typing');
      for (let i = 0; i <= d.imei.length; i++) { if (!mounted) return; setImeiNum(d.imei.slice(0, i)); await new Promise(r => setTimeout(r, 50)); }
      setImeiPhase('querying');
      await new Promise(r => setTimeout(r, 1500));
      if (!mounted) return;
      setImeiPhase('results'); setImeiResult(d);
      await new Promise(r => setTimeout(r, 8000));
      if (!mounted) return;
      setImeiIdx((p) => (p + 1) % imeiData.length);
    };
    run();
    return () => { mounted = false; };
  }, [imeiIdx, imeiInView]);

  useEffect(() => {
    if (!repairInView) return;
    const interval = setInterval(() => setCurrentStep((p) => (p + 1) % repairSteps.length), 3000);
    return () => clearInterval(interval);
  }, [repairInView]);

  useEffect(() => {
    if (!commInView) return;
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const run = async () => {
      if (!mounted || !commInView) return;
      const messageSet = communicationMessageSets[commMessageSetIdx];
      setVisibleMessages(0);
      
      // Show messages one by one like chat bubbles
      for (let i = 1; i <= messageSet.length; i++) {
        if (!mounted || !commInView) return;
        setVisibleMessages(i);
        await new Promise(r => setTimeout(r, 2000));
      }
      
      // After showing all messages, wait then cycle to next set
      await new Promise(r => setTimeout(r, 3000));
      if (!mounted || !commInView) return;
      
      timeoutId = setTimeout(() => {
        if (!mounted || !commInView) return;
        setCommMessageSetIdx((p) => (p + 1) % communicationMessageSets.length);
      }, 1000);
    };
    
    run();
    return () => { 
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [commMessageSetIdx, commInView]);

  useEffect(() => {
    if (!riskInView) return;
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const run = async () => {
      if (!mounted || !riskInView) return;
      
      // Show one alert at a time, rotating through different examples
      const alert = riskAlerts[riskAlertIdx];
      setVisibleAlerts(1);
      
      // Show alert for 4-6 seconds, then cycle to next
      const cycleDelay = 4000 + Math.random() * 2000;
      timeoutId = setTimeout(() => {
        if (!mounted || !riskInView) return;
        setRiskAlertIdx((p) => (p + 1) % riskAlerts.length);
      }, cycleDelay);
    };
    
    run();
    return () => { 
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [riskAlertIdx, riskInView]);

  // Inventory demo - show parts decrementing, reorder status, order confirmations
  useEffect(() => {
    if (!inventoryInView) return;
    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;
    
    const decrementCycle = () => {
      if (!mounted || !inventoryInView) return;
      
      setInventoryStock(prev => {
        // Randomly decrement a part
        const parts = Object.keys(prev);
        const randomPart = parts[Math.floor(Math.random() * parts.length)];
        const currentQty = prev[randomPart as keyof typeof prev];
        
        if (currentQty > 0) {
          const newQty = Math.max(0, currentQty - 1);
          
          // If stock gets low and auto-reorder is ON, show order placed
          if (newQty <= 2 && inventoryAutoReorder) {
            setTimeout(() => {
              if (!mounted || !inventoryInView) return;
              setInventoryOrderPlaced(true);
              setTimeout(() => {
                if (!mounted || !inventoryInView) return;
                setInventoryOrderPlaced(false);
                setInventoryStock(p => ({
                  ...p,
                  [randomPart]: 5
                }));
              }, 3000);
            }, 2000);
          }
          
          return {
            ...prev,
            [randomPart]: newQty
          };
        }
        return prev;
      });
    };
    
    // Run decrement cycle every 8-12 seconds
    intervalId = setInterval(decrementCycle, 8000 + Math.random() * 4000);
    
    return () => { 
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [inventoryInView, inventoryAutoReorder]);

  const currentDx = dxData[dxIdx];

  return (
    <FixoProvider>
      <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <MarketingNav />
      <div className="bg-structure">
        <div className="bg-grid" />
        <div className="vertical-rail left" />
        <div className="vertical-rail right" />
      </div>
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        {/* NAV */}
        <nav
          className="hidden md:block"
          data-marketing-desktop-nav
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 100, 
            padding: scrolled ? '12px 0' : '16px 0', 
            background: scrolled ? 'rgba(15,10,26,.96)' : 'rgba(15,10,26,.92)', 
            backdropFilter: 'blur(20px)', 
            borderBottom: '1px solid rgba(167,139,250,.08)',
            transition: 'padding .25s ease, background .25s ease, border-color .25s ease',
            willChange: 'padding, background'
          }}
          aria-label="Main navigation"
        >
          <div style={{
            maxWidth: 1600,
            margin: '0 auto',
            width: '100%',
            padding: '0 64px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            justifyItems: 'stretch',
            gap: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }} aria-label="Fixology home">
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#a78bfa 0%,#c4b5fd 100%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
            <span style={{ fontWeight: 700, fontSize: 20, color: '#fff', letterSpacing: '-0.02em' }}>Fixology</span>
          </a>
              <span className="trust-pill">
                ✨ Built for repair shops
              </span>
          </div>
            <div className="nav-center" style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center', minWidth: 0, justifySelf: 'center' }}>
              <a href="#how-it-works" className="nav-link" aria-label="How It Works">How It Works</a>
              <a href="#what-fixology-handles" className="nav-link" aria-label="What Fixology Handles For You">What You Get</a>
              <a href="#pricing" className={`nav-link ${activeSection === 'pricing' ? 'active' : ''}`} aria-label="View pricing">Pricing</a>
              <a href="#contact" className="nav-link" aria-label="Contact">Contact</a>
            </div>
            <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <a href="/login" className="login-link" aria-label="Log in to your account">Log in</a>
              <Link href="/signup" className="header-cta" aria-label="Get started">
                Get Started →
              </Link>
              <button className="nav-mobile" style={{ display: 'none', background: 'transparent', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }} aria-label="Menu">☰</button>
            </div>
          </div>
        </nav>

        {/* Floating Tech Emojis - Professional & Subtle */}
        <div className="floating" style={{ position: 'fixed', top: '10%', left: '5%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>📱</div>
        <div className="floating floating-d1" style={{ position: 'fixed', top: '25%', left: '3%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>💻</div>
        <div className="floating floating-d2" style={{ position: 'fixed', top: '45%', left: '8%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>⌚</div>
        <div className="floating" style={{ position: 'fixed', top: '65%', left: '4%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>🎮</div>
        <div className="floating floating-d1" style={{ position: 'fixed', top: '85%', left: '6%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>🖥️</div>
        
        <div className="floating floating-d2" style={{ position: 'fixed', top: '15%', left: '15%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>📺</div>
        <div className="floating" style={{ position: 'fixed', top: '35%', left: '12%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>⌨️</div>
        <div className="floating floating-d1" style={{ position: 'fixed', top: '55%', left: '18%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>🖱️</div>
        <div className="floating floating-d2" style={{ position: 'fixed', top: '75%', left: '14%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>📱</div>
        <div className="floating" style={{ position: 'fixed', top: '95%', left: '16%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>💻</div>
        
        <div className="floating floating-d1" style={{ position: 'fixed', top: '20%', left: '25%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>⌚</div>
        <div className="floating floating-d2" style={{ position: 'fixed', top: '40%', left: '22%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>🎮</div>
        <div className="floating" style={{ position: 'fixed', top: '60%', left: '28%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>🖥️</div>
        <div className="floating floating-d1" style={{ position: 'fixed', top: '80%', left: '24%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>📺</div>
        
        <div className="floating floating-d2" style={{ position: 'fixed', top: '12%', left: '35%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>⌨️</div>
        <div className="floating" style={{ position: 'fixed', top: '32%', left: '38%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>🖱️</div>
        <div className="floating floating-d1" style={{ position: 'fixed', top: '52%', left: '35%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>📱</div>
        <div className="floating floating-d2" style={{ position: 'fixed', top: '72%', left: '40%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>💻</div>
        <div className="floating" style={{ position: 'fixed', top: '92%', left: '37%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>⌚</div>
        
        <div className="floating floating-d1" style={{ position: 'fixed', top: '18%', left: '48%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>🎮</div>
        <div className="floating floating-d2" style={{ position: 'fixed', top: '38%', left: '52%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>🖥️</div>
        <div className="floating" style={{ position: 'fixed', top: '58%', left: '48%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>📺</div>
        <div className="floating floating-d1" style={{ position: 'fixed', top: '78%', left: '51%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>⌨️</div>
        <div className="floating floating-d2" style={{ position: 'fixed', top: '98%', left: '49%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>🖱️</div>
        
        <div className="floating" style={{ position: 'fixed', top: '14%', left: '62%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>📱</div>
        <div className="floating floating-d1" style={{ position: 'fixed', top: '34%', left: '65%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>💻</div>
        <div className="floating floating-d2" style={{ position: 'fixed', top: '54%', left: '62%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>⌚</div>
        <div className="floating" style={{ position: 'fixed', top: '74%', left: '66%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>🎮</div>
        <div className="floating floating-d1" style={{ position: 'fixed', top: '94%', left: '64%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>🖥️</div>
        
        <div className="floating floating-d2" style={{ position: 'fixed', top: '22%', left: '75%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>📺</div>
        <div className="floating" style={{ position: 'fixed', top: '42%', left: '78%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>⌨️</div>
        <div className="floating floating-d1" style={{ position: 'fixed', top: '62%', left: '75%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>🖱️</div>
        <div className="floating floating-d2" style={{ position: 'fixed', top: '82%', left: '79%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>📱</div>
        
        <div className="floating" style={{ position: 'fixed', top: '16%', left: '88%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>💻</div>
        <div className="floating floating-d1" style={{ position: 'fixed', top: '36%', left: '91%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>⌚</div>
        <div className="floating floating-d2" style={{ position: 'fixed', top: '56%', left: '88%', fontSize: 20, opacity: .1, zIndex: 0, pointerEvents: 'none' }}>🎮</div>
        <div className="floating" style={{ position: 'fixed', top: '76%', left: '92%', fontSize: 24, opacity: .15, zIndex: 0, pointerEvents: 'none' }}>🖥️</div>
        <div className="floating floating-d1" style={{ position: 'fixed', top: '96%', left: '89%', fontSize: 22, opacity: .12, zIndex: 0, pointerEvents: 'none' }}>📺</div>

        {/* HERO */}
        <section ref={heroRef} id="demo" className="section-spacer" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 110, position: 'relative', overflow: 'hidden' }}>
          <div className="wide-container">
            <div className="asymmetric-layout">
              <div className="text-constraint">
              <div style={{ display: 'inline-block', padding: '8px 18px', background: 'rgba(167,139,250,.15)', borderRadius: 50, marginBottom: 24, border: '1px solid rgba(167,139,250,.3)' }}>
                <span style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 500 }}>✨ Repair Intelligence System</span>
              </div>
                <h1 className="section-title hero-title" style={{ fontSize: 'clamp(34px,4.8vw,64px)', marginBottom: 24, textAlign: 'left' }}>Your techs stop guessing.<br /><span style={{ color: '#a78bfa' }}>Your tickets write themselves.</span></h1>
                <p className="hero-sub" style={{ fontSize: 20, color: '#c4b5fd', lineHeight: 1.7, marginBottom: 32, maxWidth: 600 }}>Fixology turns messy customer messages into diagnoses, tickets, pricing, inventory actions, and customer updates — automatically.</p>
                <div className="hero-bullets" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 48 }}>
                  {[
                    "Works with how your shop already runs",
                    "Fewer comebacks with guided steps + risk alerts",
                    "Tickets created from one sentence"
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, color: 'rgba(196,181,253,0.8)' }}>
                      <span style={{ color: '#4ade80' }}>✔</span>
                      <span>{text}</span>
              </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="hero-actions" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="glow-button" onClick={(e) => { 
                      e.preventDefault();
                      document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
                    }} style={{ fontSize: 18, padding: '18px 40px' }}>Get Started</button>
                    <button className="glow-button glow-button-secondary" onClick={(e) => {
                      e.preventDefault();
                      // TODO: Open video demo modal
                      document.querySelector('#diagnosis')?.scrollIntoView({ behavior: 'smooth' });
                    }} style={{ background: 'transparent', border: '1px solid rgba(167,139,250,.3)', color: 'rgba(196,181,253,.9)', padding: '18px 32px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>▶</span>
                      <span>Watch Demo</span>
                    </button>
                  </div>
                  <span className="hero-sub" style={{ fontSize: 14, color: 'rgba(196,181,253,.5)', marginLeft: 4 }}>Takes 60 seconds. No setup.</span>
                </div>
                {/* Device imagery placeholders */}
                <div className="hero-icons" style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 12, background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, opacity: 0.7 }}>
                    📱
                  </div>
                  <div style={{ width: 80, height: 80, borderRadius: 12, background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, opacity: 0.7 }}>
                    🎮
                  </div>
                  <div style={{ width: 80, height: 80, borderRadius: 12, background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, opacity: 0.7 }}>
                    💻
                  </div>
                </div>
              </div>
              <div className="glass-card" style={{ padding: 32, minHeight: 400, transform: 'perspective(1000px) rotateY(-5deg) translateX(20px)', boxShadow: '0 30px 100px rgba(0,0,0,0.5), 0 0 40px rgba(167,139,250,0.1)', position: 'relative' }}>
                {/* Video demo thumbnail placeholder */}
                <div style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer' }} onClick={(e) => {
                  e.preventDefault();
                  // TODO: Open video demo modal
                  document.querySelector('#diagnosis')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <div style={{ padding: '8px 14px', background: 'rgba(0,0,0,.6)', borderRadius: 8, border: '1px solid rgba(167,139,250,.3)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c4b5fd', transition: 'all .3s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(167,139,250,.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,.6)'; }}>
                    <span style={{ fontSize: 14 }}>▶</span>
                    <span>90-sec demo</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.1em' }}>Live example</div>
                <div style={{ background: 'rgba(15,10,26,0.9)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 16, padding: 20, marginBottom: 24, minHeight: 120 }}>
                  <div style={{ fontSize: 16, color: '#fff', fontStyle: 'italic', lineHeight: 1.6 }}>"{dxInput || heroDemoData.message}"</div>
                  {dxPhase === 'typing' && <span style={{ display: 'inline-block', width: 3, height: 20, background: '#a78bfa', marginLeft: 2, animation: 'blink 1s infinite', verticalAlign: 'middle' }} />}
                </div>
                {dxPhase === 'results' && visibleCauses > 0 && (
                  <div className="fade-in">
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#4ade80', marginBottom: 12, textTransform: 'uppercase' }}>→ Intelligence Output</div>
                    <div style={{ background: 'rgba(74,222,128,.05)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 16, padding: 24 }}>
                      <div style={{ fontSize: 18, color: '#fff', fontWeight: 700, marginBottom: 8 }}>Most likely issue: {heroDemoData.issue} ({heroDemoData.pct}%)</div>
                      <div style={{ fontSize: 14, color: '#c4b5fd', marginBottom: 16, lineHeight: 1.5 }}>{heroDemoData.explanation}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 10 }}>Recommended next step:</div>
                      <div style={{ fontSize: 16, color: '#a78bfa', marginBottom: 12, fontWeight: 600 }}>{heroDemoData.repair}</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 14, color: '#fff', fontWeight: 500, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, width: 'fit-content' }}>
                        <span>{heroDemoData.time}</span>
                        <span style={{ opacity: 0.3 }}>|</span>
                        <span>{heroDemoData.price}</span>
                      </div>
                    </div>
                    {visibleCauses >= 2 && (
                      <div className="fade-in" style={{ marginTop: 20, padding: 12, background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 600, letterSpacing: '0.02em' }}>
                          ✔ Ticket created • ✔ Pricing ready • ✔ Customer update prepared
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF BAR */}
        <section style={{ padding: '24px 0', background: 'rgba(167,139,250,.02)', borderTop: '1px solid rgba(167,139,250,.1)', borderBottom: '1px solid rgba(167,139,250,.1)' }}>
          <div className="wide-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 15, color: '#c4b5fd', fontWeight: 500 }}>
                Trusted by <span style={{ color: '#a78bfa', fontWeight: 600 }}>50+ repair shops</span> in <span style={{ color: '#a78bfa', fontWeight: 600 }}>12 states</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {['Texas', 'California', 'Florida', 'New York'].map((state, i) => (
                  <div key={i} style={{ padding: '6px 14px', background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 20, fontSize: 12, color: '#c4b5fd', fontWeight: 500 }}>
                    {state}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STICKY CTA ON SCROLL */}
        {pastHero && (
          <div className="sticky-cta-desktop" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: '16px 24px', background: 'rgba(15,10,26,.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(167,139,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, transition: 'transform .3s ease', transform: pastHero ? 'translateY(0)' : 'translateY(100%)' }}>
            <span style={{ fontSize: 15, color: '#c4b5fd', fontWeight: 500 }}>Ready to stop guessing?</span>
            <button className="glow-button" onClick={(e) => {
              e.preventDefault();
              document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
            }} style={{ fontSize: 14, padding: '10px 24px' }}>Get Started →</button>
          </div>
        )}

        {/* 1. DIAGNOSIS */}
        <section ref={dxRef} style={{ padding: '100px 0', scrollMarginTop: '120px' }} id="diagnosis">
          <div className="narrow-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
            <div style={{ textAlign: 'center', marginBottom: 50 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(167,139,250,.15)', borderRadius: 50, marginBottom: 16, border: '1px solid rgba(167,139,250,.3)' }}>
                <span className="status-dot" style={{ background: '#4ade80' }} />
                <span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em' }}>Diagnosis</span>
              </div>
              <h2 className="section-title">Symptoms in. Answers out.</h2>
              <p style={{ fontSize: 16, color: '#a1a1aa', maxWidth: 480, margin: '16px auto 0' }}>Turn vague customer complaints into clear, ranked probable causes</p>
            </div>
            <div className={`glass-card demo-container ${dxPhase === 'analyzing' ? 'glass-card-active' : ''}`} style={{ minHeight: 480, maxHeight: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(167,139,250,.15)', background: 'rgba(167,139,250,.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#a78bfa,#c4b5fd)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{currentDx.deviceEmoji}</div>
                  <div><div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{currentDx.device}</div><div style={{ fontSize: 12, color: '#a78bfa' }}>Diagnostic Analysis</div></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: dxPhase === 'analyzing' ? 'rgba(251,191,36,.1)' : 'rgba(74,222,128,.1)', borderRadius: 20, border: `1px solid ${dxPhase === 'analyzing' ? 'rgba(251,191,36,.3)' : 'rgba(74,222,128,.3)'}` }}>
                  {dxPhase === 'analyzing' ? <><div style={{ display: 'flex', gap: 4 }}><span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" /></div><span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 500, marginLeft: 6 }}>Analyzing</span></> : <><span className="status-dot" style={{ background: '#4ade80' }} /><span style={{ fontSize: 12, color: '#4ade80', fontWeight: 500 }}>{dxPhase === 'typing' ? 'Listening' : 'Complete'}</span></>}
                </div>
              </div>
              <div className="demo-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 400, overflow: 'hidden' }}>
                <div style={{ padding: 24, borderRight: '1px solid rgba(167,139,250,.1)', overflow: 'auto' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 14 }}>💬 Customer Description</div>
                  <div style={{ background: 'rgba(15,10,26,.8)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 14, padding: 18, minHeight: 100, position: 'relative' }}>
                    {dxPhase === 'analyzing' && dxInView && <div className="scan-line" />}
                    <span style={{ fontFamily: 'Georgia,serif', fontSize: 15, lineHeight: 1.7, color: '#EDE9FE', fontStyle: 'italic' }}>"{dxInput}"</span>
                    {dxPhase === 'typing' && dxInView && <span style={{ display: 'inline-block', width: 2, height: 18, background: '#a78bfa', marginLeft: 2, animation: 'blink 1s infinite', verticalAlign: 'middle' }} />}
                  </div>
                  {dxPhase === 'results' && <div className="fade-in" style={{ marginTop: 16 }}><div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 10 }}>🔍 System Interpretation</div><div style={{ background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 12, padding: 14 }}><p style={{ fontSize: 13, color: '#c4b5fd', lineHeight: 1.6 }}>{currentDx.systemNotices}</p></div></div>}
                </div>
                <div style={{ padding: 24, background: 'rgba(167,139,250,.03)', overflow: 'auto' }}>
                  {dxPhase === 'results' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Layer 1: Always visible - THE "OH SHIT" MOMENT */}
                      {visibleCauses > 0 && currentDx.causes[0] && (
                        <div className="fade-in" style={{ padding: 20, background: 'linear-gradient(135deg,rgba(74,222,128,.15),rgba(74,222,128,.08))', borderRadius: 12, border: '1px solid rgba(74,222,128,.25)' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', marginBottom: 8, textTransform: 'uppercase' }}>Most likely issue</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{currentDx.causes[0].headline} ({currentDx.causes[0].pct}%)</div>
                          <div style={{ fontSize: 13, color: '#c4b5fd', marginBottom: 12 }}>{currentDx.causes[0].explanation}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Recommended next step:</div>
                          <div style={{ fontSize: 14, color: '#a78bfa', marginBottom: 12 }}>{currentDx.est.repair}</div>
                          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#fff', fontWeight: 500 }}>
                            <span>{currentDx.est.time}</span>
                            <span>•</span>
                            <span>{currentDx.est.price}</span>
                </div>
              </div>
                      )}
                      {/* Layer 2: Other possibilities - cascade in */}
                      {visibleCauses > 1 && (
                        <div className="fade-in">
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', marginBottom: 8, textTransform: 'uppercase' }}>Other possibilities</div>
                          {currentDx.causes.slice(1, Math.min(visibleCauses, 3)).map((c, i) => (
                            <div key={i} style={{ padding: 12, background: 'rgba(167,139,250,.05)', borderRadius: 8, marginBottom: 8, border: '1px solid rgba(167,139,250,.1)' }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{c.headline} ({c.pct}%)</div>
                              <div style={{ fontSize: 12, color: '#a1a1aa' }}>{c.explanation}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* 4.0-5.0s: Final punch line */}
                      {visibleCauses >= 2 && (
                        <div className="fade-in" style={{ marginTop: 8, padding: 12, background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 500 }}>
                            ✔ Ticket created • ✔ Pricing ready • ✔ Customer update prepared
                          </div>
                        </div>
                      )}
                      {/* Layer 3: Technical details (hidden by default) */}
                      {visibleCauses === currentDx.causes.length && (
                        <div className="fade-in">
                          <button
                            onClick={() => setShowTechDetails(!showTechDetails)}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(167,139,250,.2)',
                              borderRadius: 8,
                              padding: '8px 12px',
                              color: '#a78bfa',
                              fontSize: 12,
                              cursor: 'pointer',
                              width: '100%',
                              transition: 'all .2s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(167,139,250,.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            {showTechDetails ? 'Hide' : 'Show'} technical notes
                          </button>
                          {showTechDetails && (
                            <div style={{ marginTop: 12, padding: 16, background: 'rgba(15,10,26,.6)', borderRadius: 8, border: '1px solid rgba(167,139,250,.15)' }}>
                              {currentDx.causes.map((c, i) => (
                                <div key={i} style={{ marginBottom: 12 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 4 }}>{c.headline}</div>
                                  <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>{c.confidence}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bridge-text">"Once the problem is clear, the rest should follow."</div>

        {/* HOW IT WORKS */}
        <section id="how-it-works" style={{ padding: '60px 0', background: 'rgba(167,139,250,.03)', scrollMarginTop: '120px' }}>
          <div className="narrow-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h3 style={{ fontSize: 24, fontWeight: 600, color: '#fff', marginBottom: 8 }}>The Fixology Loop</h3>
              <p style={{ fontSize: 14, color: '#a1a1aa' }}>Customer message → Diagnosis → Ticket + Price → Updates + Risk</p>
            </div>
            <div className="how-steps" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '20px 0' }}>
              {['Message', 'Diagnosis', 'Ticket + Price', 'Updates + Risk'].map((step, i) => (
                <div key={i} className="how-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: dxInView && i === 0 ? 'linear-gradient(135deg,#a78bfa,#c4b5fd)' : tkInView && i === 1 ? 'linear-gradient(135deg,#a78bfa,#c4b5fd)' : i < 2 ? 'rgba(167,139,250,.2)' : 'rgba(167,139,250,.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    transition: 'all .3s ease',
                    boxShadow: (dxInView && i === 0) || (tkInView && i === 1) ? '0 0 20px rgba(167,139,250,.4)' : 'none'
                  }}>
                    {i === 0 ? '💬' : i === 1 ? '🔍' : i === 2 ? '🎫' : '💬'}
              </div>
                  <div style={{ fontSize: 12, color: '#c4b5fd', marginTop: 8, textAlign: 'center', fontWeight: 500 }}>{step}</div>
                  {i < 3 && (
                    <div className="how-connector" style={{
                      position: 'absolute',
                      top: 25,
                      left: '60%',
                      width: '80%',
                      height: 2,
                      background: i < 1 ? 'linear-gradient(90deg, rgba(167,139,250,.4), rgba(167,139,250,.1))' : 'rgba(167,139,250,.1)',
                      zIndex: -1
                    }} />
                  )}
                </div>
              ))}
                  </div>
                </div>
        </section>

        {/* OUTCOMES */}
        <section id="outcomes" style={{ padding: '40px 0', background: 'rgba(167,139,250,.05)', borderTop: '1px solid rgba(167,139,250,.1)', borderBottom: '1px solid rgba(167,139,250,.1)', scrollMarginTop: '120px' }}>
          <div className="narrow-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
            <div className="outcomes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>2+ hrs</div>
                <div style={{ fontSize: 14, color: '#c4b5fd' }}>Saved per day</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>18%</div>
                <div style={{ fontSize: 14, color: '#c4b5fd' }}>Fewer comebacks</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>3x</div>
                <div style={{ fontSize: 14, color: '#c4b5fd' }}>Faster approvals</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>0</div>
                <div style={{ fontSize: 14, color: '#c4b5fd' }}>Bad devices accepted</div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. TICKETING */}
        <section ref={tkRef} className="section-spacer" style={{ scrollMarginTop: '120px' }} id="ticketing">
          <div className="wide-container">
            <div className="asymmetric-layout" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
              <div className="glass-card demo-container" style={{ minHeight: 520, maxHeight: 520, transform: 'perspective(1000px) rotateY(2deg)', boxShadow: '0 20px 80px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(167,139,250,.15)', background: 'rgba(167,139,250,.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><div style={{ width: 48, height: 44, background: 'linear-gradient(135deg,#a78bfa,#c4b5fd)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✍️</div><div><div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>Natural Language Parser</div><div style={{ fontSize: 13, color: '#a78bfa' }}>Continuous Extraction</div></div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: 'rgba(74,222,128,.1)', borderRadius: 24, border: '1px solid rgba(74,222,128,.3)' }}><span className="status-dot" style={{ background: '#4ade80' }} /><span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>Active</span></div>
                </div>
                <div className="demo-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 440 }}>
                  <div style={{ padding: 28, borderRight: '1px solid rgba(167,139,250,.1)', background: 'rgba(15,10,26,0.4)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 16 }}>🎤 Input Stream</div>
                    <div style={{ background: 'rgba(15,10,26,.8)', border: '1px solid rgba(167,139,250,.25)', borderRadius: 16, padding: 20, minHeight: 120 }}><span style={{ fontFamily: 'monospace', fontSize: 15, lineHeight: 1.8, color: '#EDE9FE' }}>{tkInput}</span><span style={{ display: 'inline-block', width: 3, height: 20, background: '#a78bfa', marginLeft: 2, animation: 'blink 1s infinite', verticalAlign: 'middle' }} /></div>
                  </div>
                  <div style={{ padding: 28, background: 'rgba(167,139,250,.02)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#4ade80', marginBottom: 16 }}>📋 Auto-Generated Ticket</div>
                    <div className="demo-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[{ l: 'Customer', v: tkFields.customer }, { l: 'Phone', v: tkFields.phone }, { l: 'Device', v: tkFields.device }, { l: 'Repair', v: tkFields.repair }].map((f, i) => <div key={i} className="ticker-field"><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#a78bfa', marginBottom: 6 }}>{f.l}</div><div style={{ fontSize: 14, minHeight: 20, color: '#fff', fontWeight: 600 }}>{f.v || '—'}</div></div>)}
                      <div className="ticker-field" style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#a78bfa', marginBottom: 6 }}>Notes</div><div style={{ fontSize: 14, minHeight: 20, color: '#fff', lineHeight: 1.5 }}>{tkFields.note || '—'}</div></div>
                      <div className="ticker-field"><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#a78bfa', marginBottom: 6 }}>Technician</div><div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{tkFields.tech || '—'}</div></div>
                      <div className="ticker-field"><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#a78bfa', marginBottom: 6 }}>Internal ID</div><div style={{ fontSize: 14, color: '#4ade80', fontWeight: 700 }}>{tkFields.id || '—'}</div></div>
                    </div>
                    {tkSubmitted && <div className="fade-in" style={{ marginTop: 24, padding: 16, background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.3)', borderRadius: 12, textAlign: 'center' }}><span style={{ color: '#4ade80', fontSize: 14, fontWeight: 600 }}>✓ Ready for technician signature</span></div>}
                  </div>
                </div>
              </div>
              <div className="text-constraint" style={{ marginLeft: 'auto', marginRight: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(167,139,250,.15)', borderRadius: 50, marginBottom: 24, border: '1px solid rgba(167,139,250,.3)' }}><span style={{ fontSize: 14 }}>🎫</span><span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em' }}>Ticketing</span></div>
                <h2 className="section-title" style={{ marginBottom: 24, textAlign: 'left' }}>One sentence. Full ticket.</h2>
                <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 32 }}>Type naturally. The system extracts everything. No more manual entry fields for customer names, device variants, or repair notes.</p>
                <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(167,139,250,0.1)' }}>
                  <div style={{ color: '#a78bfa', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>✓ Workflow Speed</div>
                  <p style={{ fontSize: 14, color: '#c4b5fd', lineHeight: 1.6 }}>Reduce intake time from 4 minutes to 40 seconds. Fixology handles the structure so you can focus on the customer.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bridge-text">"Knowing the device isn't enough. You need to know the risk."</div>

        {/* 3. IMEI */}
        <section ref={imeiRef} className="section-spacer" id="imei">
          <div className="wide-container">
            <div className="asymmetric-layout" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
              <div className="text-constraint">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(167,139,250,.15)', borderRadius: 50, marginBottom: 24, border: '1px solid rgba(167,139,250,.3)' }}><span style={{ fontSize: 14 }}>🔎</span><span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em' }}>IMEI Intelligence</span></div>
                <h2 className="section-title" style={{ marginBottom: 24, textAlign: 'left' }}>Know the device before you touch it</h2>
                <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 32 }}>Lock status, carrier, blacklist — all checked instantly. Protect your shop from stolen devices and liability issues before you even open the case.</p>
                <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(167,139,250,0.1)' }}>
                  <div style={{ color: '#ef4444', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>✓ Risk Prevention</div>
                  <p style={{ fontSize: 14, color: '#c4b5fd', lineHeight: 1.6 }}>"We caught three blacklisted devices in our first month. Fixology paid for itself by preventing just one bad repair."</p>
            </div>
              </div>
              <div className={`glass-card demo-container ${imeiPhase === 'querying' ? 'glass-card-active' : ''}`} style={{ minHeight: 520, maxHeight: 520, transform: 'perspective(1000px) rotateY(-2deg)', boxShadow: '0 20px 80px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(167,139,250,.15)', background: 'rgba(167,139,250,.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><div style={{ width: 48, height: 44, background: 'linear-gradient(135deg,#a78bfa,#c4b5fd)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📡</div><div><div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>Device Intelligence</div><div style={{ fontSize: 13, color: '#a78bfa' }}>Global Database Access</div></div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: imeiPhase === 'querying' ? 'rgba(251,191,36,.1)' : 'rgba(74,222,128,.1)', borderRadius: 24, border: `1px solid ${imeiPhase === 'querying' ? 'rgba(251,191,36,.3)' : 'rgba(74,222,128,.3)'}` }}>{imeiPhase === 'querying' ? <><div style={{ display: 'flex', gap: 4 }}><span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" /></div><span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, marginLeft: 6 }}>Querying</span></> : <><span className="status-dot" style={{ background: '#4ade80' }} /><span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>{imeiPhase === 'results' ? 'Verified' : 'Ready'}</span></>}</div>
                </div>
                <div className="demo-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 440 }}>
                  <div style={{ padding: 28, borderRight: '1px solid rgba(167,139,250,.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(15,10,26,0.4)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 16, textAlign: 'center' }}>Captured IMEI</div>
                    <div style={{ background: 'rgba(15,10,26,.8)', border: '1px solid rgba(167,139,250,.25)', borderRadius: 16, padding: 32, textAlign: 'center', position: 'relative' }}>{imeiPhase === 'querying' && <div className="scan-line" />}<div className="imei-number" style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 800, letterSpacing: '.08em', color: '#fff' }}>{imeiNum}<span style={{ display: 'inline-block', width: 3, height: 24, background: '#a78bfa', marginLeft: 2, animation: 'blink 1s infinite', verticalAlign: 'middle' }} /></div><div style={{ fontSize: 13, color: '#a78bfa', marginTop: 12, fontWeight: 500 }}>📷 Auto-Scanned</div></div>
                  </div>
                  <div style={{ padding: 28, background: 'rgba(167,139,250,.02)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#4ade80', marginBottom: 16 }}>📊 Instant Device Report</div>
                    {imeiPhase === 'querying' && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div style={{ textAlign: 'center' }}><div style={{ width: 48, height: 48, border: '4px solid rgba(167,139,250,.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} /><div style={{ color: '#a78bfa', fontSize: 14, fontWeight: 500 }}>Connecting to Carrier GSMA...</div></div></div>}
                    {imeiResult && imeiPhase === 'results' && <div className="fade-in" style={{ background: 'rgba(15,10,26,.6)', border: '1px solid rgba(167,139,250,.25)', borderRadius: 16, padding: 20 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(167,139,250,.15)' }}><div><div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{imeiResult.device}</div><div style={{ fontSize: 13, color: '#a78bfa', fontWeight: 500, marginTop: 4 }}>{imeiResult.storage} • {imeiResult.color}</div></div><span style={{ padding: '8px 16px', borderRadius: 24, fontSize: 12, fontWeight: 700, background: imeiResult.fmi === 'ON' ? 'rgba(251,191,36,.15)' : 'rgba(74,222,128,.15)', color: imeiResult.fmi === 'ON' ? '#fbbf24' : '#4ade80', border: `1px solid ${imeiResult.fmi === 'ON' ? 'rgba(251,191,36,.3)' : 'rgba(74,222,128,.3)'}` }}>{imeiResult.fmi === 'ON' ? '⚠️ FMI ON' : '✓ FMI OFF'}</span></div><div className="imei-report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>{[{ l: 'Carrier', v: imeiResult.carrier }, { l: 'SIM Lock', v: imeiResult.simlock, w: imeiResult.simlock === 'Locked' }, { l: 'Blacklist', v: imeiResult.blacklist, ok: true }, { l: 'Warranty', v: imeiResult.warranty }].map((item, i) => <div key={i} style={{ padding: 14, background: 'rgba(167,139,250,.05)', borderRadius: 12, border: '1px solid rgba(167,139,250,0.1)' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>{item.l}</div><div style={{ fontSize: 14, fontWeight: 700, color: item.ok ? '#4ade80' : item.w ? '#fbbf24' : '#fff' }}>{item.v}</div></div>)}</div></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bridge-text">"Diagnosis means nothing if execution is inconsistent."</div>

        {/* 4. REPAIR GUIDANCE */}
        <section ref={repairRef} className="section-spacer" id="guidance">
          <div className="wide-container">
            <div className="asymmetric-layout" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
              <div className="glass-card demo-container" style={{ padding: 32, minHeight: 520, maxHeight: 520, transform: 'perspective(1000px) rotateY(2deg)', boxShadow: '0 20px 80px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {repairSteps.map((step, i) => (
                    <div key={i} className={`step-card ${i === currentStep ? 'glass-card-active' : ''}`} style={{ opacity: i <= currentStep ? 1 : .3, borderColor: i === currentStep ? 'rgba(167,139,250,.5)' : 'rgba(167,139,250,0.1)', padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: i < currentStep ? 'rgba(74,222,128,.2)' : i === currentStep ? 'linear-gradient(135deg,#a78bfa,#c4b5fd)' : 'rgba(167,139,250,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: i < currentStep ? '#4ade80' : i === currentStep ? '#0f0a1a' : '#6b7280' }}>
                          {i < currentStep ? '✓' : step.step}
            </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{step.title}</div>
                          {step.warning && i === currentStep && <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 6, fontWeight: 500 }}>⚠️ {step.warning}</div>}
              </div>
                        <div style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600, background: 'rgba(167,139,250,0.1)', padding: '4px 10px', borderRadius: 6 }}>⏱️ {step.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 24, padding: 18, background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 14, textAlign: 'center' }}>
                  <span style={{ color: '#4ade80', fontSize: 14, fontWeight: 600, letterSpacing: '0.02em' }}>Consistency Optimized: Technicians follow senior-approved workflows.</span>
                </div>
              </div>
              <div className="text-constraint" style={{ marginLeft: 'auto', marginRight: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(167,139,250,.15)', borderRadius: 50, marginBottom: 24, border: '1px solid rgba(167,139,250,.3)' }}><span style={{ fontSize: 14 }}>🔧</span><span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em' }}>Repair Guidance</span></div>
                <h2 className="section-title" style={{ marginBottom: 24, textAlign: 'left' }}>Step-by-step guidance so techs don't miss steps</h2>
                <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 32 }}>Built-in quality control. Guides technicians through complex repairs with real-time warnings and time estimates. Reduce comebacks and improve consistency across all your shop locations.</p>
                <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(167,139,250,0.1)' }}>
                  <div style={{ color: '#fbbf24', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>✓ Training Acceleration</div>
                  <p style={{ fontSize: 14, color: '#c4b5fd', lineHeight: 1.6 }}>New technicians ramp up 40% faster with step-by-step guidance. No more shadowing needed for standard repairs.</p>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* WHAT FIXOLOGY HANDLES FOR YOU */}
        <section id="what-fixology-handles" className="section-spacer" style={{ scrollMarginTop: '120px', background: 'rgba(167,139,250,.02)' }}>
          <div className="wide-container">
            <div className="text-constraint-center" style={{ textAlign: 'center', marginBottom: 80 }}>
              <h2 className="section-title">What Fixology Handles For You</h2>
              <p style={{ fontSize: 18, color: '#a1a1aa', marginTop: 16 }}>A comprehensive intelligence layer for every stage of your repair business.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
              {[
                {
                  title: "Intake & Diagnosis",
                  items: [
                    { emoji: "🔍", h: "Faster Diagnosis", p: "Turn vague complaints into ranked probable causes instantly" },
                    { emoji: "🎫", h: "Automatic Tickets", p: "Tickets created automatically from customer messages" },
                    { emoji: "🛡️", h: "Device Risk Checks", p: "IMEI intelligence to catch stolen or locked devices" }
                  ]
                },
                {
                  title: "During Repair",
                  items: [
                    { emoji: "🔧", h: "Guided Repairs", p: "Step-by-step repair guidance with risk alerts" },
                    { emoji: "💬", h: "Customer Updates", p: "Automated messaging to keep customers informed" }
                  ]
                },
                {
                  title: "Money & Trust",
                  items: [
                    { emoji: "💰", h: "Price Breakdown", p: "Transparent pricing explanations for customers" },
                    { emoji: "📦", h: "AI Inventory Tracking", p: "Automatically tracks parts usage, detects duplicates, and suggests reorder quantities", badge: "NEW" }
                  ]
                }
              ].map((col, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '.15em', opacity: 0.8 }}>{col.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {col.items.map((item, i) => (
                      <div key={i} className="glass-card" style={{ padding: 32, border: item.badge ? '2px solid rgba(167,139,250,.3)' : undefined }}>
                        {item.badge && <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, color: '#4ade80', background: 'rgba(74,222,128,.15)', padding: '4px 10px', borderRadius: 6, marginBottom: 16 }}>{item.badge}</div>}
                        <div style={{ fontSize: 36, marginBottom: 16 }}>{item.emoji}</div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{item.h}</h3>
                        <p style={{ fontSize: 15, color: '#c4b5fd', lineHeight: 1.6 }}>{item.p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INVENTORY */}
        <section ref={inventoryRef} id="inventory" className="section-spacer" style={{ scrollMarginTop: '120px' }}>
          <div className="wide-container">
            <div className="asymmetric-layout" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
              <div className="text-constraint">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(74,222,128,.15)', borderRadius: 50, marginBottom: 24, border: '1px solid rgba(74,222,128,.3)' }}>
                  <span style={{ fontSize: 14 }}>📦</span>
                  <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em' }}>Inventory Intelligence</span>
                </div>
                <h2 className="section-title" style={{ marginBottom: 24, textAlign: 'left' }}>Inventory that restocks itself.</h2>
                <p style={{ fontSize: 18, color: '#c4b5fd', lineHeight: 1.7, marginBottom: 32 }}>Fixology predicts what you'll need, warns you before parts run low, and can reorder automatically based on real repair trends. Stop tying up capital in dead stock.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
                  {[
                    "Predictive stock alerts based on incoming ticket trends",
                    "Auto-reordering when critical thresholds are reached",
                    "Integrated with major parts suppliers for clean SKUs",
                    "Flags duplicate parts and mismatched variants instantly"
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, color: 'rgba(196,181,253,0.8)' }}>
                      <span style={{ color: '#4ade80' }}>✔</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card" style={{ padding: 32, minHeight: 520, transform: 'perspective(1000px) rotateY(-2deg)', boxShadow: '0 20px 80px rgba(0,0,0,0.4)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.12em' }}>Intelligent Stock Management</div>
                <div style={{ background: 'rgba(15,10,26,.9)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 15, color: '#a1a1aa', fontStyle: 'italic', lineHeight: 1.6 }}>"i14pm oled soft 2pcs + bty 14pro 5pcs + ps5 hdmi 3"</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>→ AI Normalized Results</div>
                <div className="inv-table-scroll" style={{ background: 'rgba(74,222,128,.05)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 16, padding: 16, marginBottom: 20, maxHeight: 260, overflowY: 'auto' }}>
                  {(() => {
                    const rows = [
                      { sku: 'IP14PM-OLED-SOFT', item: 'OLED Display', variant: 'iPhone 14 Pro Max', qty: inventoryStock['IP14PM-OLED-SOFT'], margin: '32%', alert: inventoryStock['IP14PM-OLED-SOFT'] <= 2 },
                      { sku: 'IP14P-BTY-GEN', item: 'Battery', variant: 'iPhone 14 Pro', qty: inventoryStock['IP14P-BTY-GEN'], margin: '28%' },
                      { sku: 'PS5-HDMI-PORT', item: 'HDMI Port', variant: 'PS5 Console', qty: inventoryStock['PS5-HDMI-PORT'], margin: '15%', warn: true },
                    ]

                    return (
                      <>
                        {/* Desktop/tablet grid (scrolls if needed) */}
                        <div className="inv-desktop">
                          <div className="inv-grid-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 0.6fr 0.8fr', gap: 12, fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(167,139,250,.2)' }}>
                            <div>SKU</div>
                            <div>Item</div>
                            <div>Variant</div>
                            <div>Qty</div>
                            <div>Margin</div>
                          </div>
                          {rows.map((row, i) => (
                            <div key={row.sku} className="inv-grid-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 0.6fr 0.8fr', gap: 12, fontSize: 13, color: '#fff', padding: '12px 0', borderBottom: i < rows.length - 1 ? '1px solid rgba(167,139,250,.1)' : 'none' }}>
                              <div style={{ fontFamily: 'monospace', fontSize: 12, opacity: 0.9 }}>{row.sku}</div>
                              <div>{row.item}</div>
                              <div style={{ fontSize: 12, color: '#c4b5fd' }}>{row.variant}</div>
                              <div style={{ color: row.alert ? '#ef4444' : row.warn ? '#fbbf24' : '#fff', fontWeight: 700 }}>{row.qty} {row.alert && '⚠️'}</div>
                              <div style={{ color: row.warn ? '#fbbf24' : '#4ade80', fontWeight: 700 }}>{row.margin}</div>
                            </div>
                          ))}
                        </div>

                        {/* Mobile cards */}
                        <div className="inv-mobile" style={{ display: 'none' }}>
                          <div style={{ display: 'grid', gap: 10 }}>
                            {rows.map((row) => (
                              <div key={row.sku} style={{ padding: 14, borderRadius: 14, background: 'rgba(15,10,26,.55)', border: '1px solid rgba(167,139,250,.14)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#fff', opacity: 0.95 }}>{row.sku}</div>
                                  <div style={{ fontSize: 12, fontWeight: 800, color: row.alert ? '#ef4444' : row.warn ? '#fbbf24' : '#4ade80' }}>
                                    {row.qty} on hand {row.alert ? '⚠️' : ''}
                                  </div>
                                </div>
                                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: '#fff' }}>{row.item}</div>
                                <div style={{ marginTop: 4, fontSize: 12, color: '#c4b5fd' }}>{row.variant}</div>
                                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
                                  <div style={{ color: '#a78bfa', fontWeight: 700 }}>Margin</div>
                                  <div style={{ color: row.warn ? '#fbbf24' : '#4ade80', fontWeight: 800 }}>{row.margin}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {inventoryStock['IP14PM-OLED-SOFT'] <= 2 && (
                    <div className="fade-in" style={{ padding: 14, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 12, fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>🚨</span> <span>Critical: Low stock predicted in 4 days</span>
                    </div>
                  )}
                  {inventoryStock['IP14PM-OLED-SOFT'] <= 2 && inventoryAutoReorder && (
                    <div className="fade-in" style={{ padding: 14, background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.3)', borderRadius: 12, fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>⚡</span> <span>Auto-reorder initiated: 5 units (Supplier A)</span>
                    </div>
                  )}
                  <div style={{ padding: 14, background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.25)', borderRadius: 12, fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span> <span>Duplicate SKU detected: {inventoryStock['IP14P-BTY-GEN'] > 0 ? 'IP14P-BTY-GEN' : '...'}</span>
                  </div>
                </div>
                <div style={{ marginTop: 24, padding: 16, background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>Auto-reorder Mode: <span style={{ color: inventoryAutoReorder ? '#4ade80' : '#6b7280' }}>{inventoryAutoReorder ? 'ACTIVE' : 'DISABLED'}</span></div>
                  <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier-Verified</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INSURANCE-READY */}
        <section id="insurance-ready" className="section-spacer" style={{ scrollMarginTop: '120px', background: 'rgba(74,222,128,0.02)' }}>
          <div className="wide-container">
            <div className="text-constraint-center" style={{ textAlign: 'center', marginBottom: 80 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(74,222,128,.1)', borderRadius: 50, marginBottom: 24, border: '1px solid rgba(74,222,128,.2)' }}>
                <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em' }}>Audit-Ready</span>
              </div>
              <h2 className="section-title">Insurance-ready by default.</h2>
              <p style={{ fontSize: 18, color: '#c4b5fd', marginTop: 16 }}>Fixology generates the professional documentation insurers expect without adding extra work for your technicians.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32 }}>
              {[
                { emoji: "📋", h: "Clean diagnostics", p: "Clear cause, confidence level, and next steps provided in insurer-standard formats." },
                { emoji: "💰", h: "Price justification", p: "Parts, labor, and warranty broken down automatically with market comparison data." },
                { emoji: "📊", h: "Audit-friendly records", p: "Complete time stamps, device identifiers, and repair logs for every single ticket." }
              ].map((card, i) => (
                <div key={i} className="glass-card" style={{ padding: 40, border: '1px solid rgba(74,222,128,0.1)' }}>
                  <div style={{ fontSize: 40, marginBottom: 24 }}>{card.emoji}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{card.h}</h3>
                  <p style={{ fontSize: 16, color: '#c4b5fd', lineHeight: 1.7 }}>{card.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AUTHORITY SIGNALS */}
        <section style={{ padding: '100px 0', background: 'rgba(167,139,250,.02)', borderTop: '1px solid rgba(167,139,250,0.05)' }}>
          <div className="wide-container">
            <div className="asymmetric-layout" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
              <div className="text-constraint">
                <h3 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 24, letterSpacing: '-0.01em' }}>Built like enterprise tools.<br /><span style={{ color: '#a78bfa' }}>Without the enterprise bloat.</span></h3>
                <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.7 }}>Fixology is engineered to meet the standards of high-volume repair operations while staying fast and intuitive for single-shop owners.</p>
              </div>
              <div className="authority-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {[
                  { emoji: "🔧", label: "Repair-first architecture" },
                  { emoji: "💳", label: "POS-ready workflows" },
                  { emoji: "👨‍🔧", label: "Designed with technicians" },
                  { emoji: "📈", label: "Scales 1 shop to many" }
                ].map((badge, i) => (
                  <div key={i} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, background: 'rgba(167,139,250,0.03)' }}>
                    <div style={{ fontSize: 24 }}>{badge.emoji}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', opacity: 0.9 }}>{badge.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SWITCH WITHOUT BREAKING YOUR SHOP */}
        <section id="switching" className="section-spacer" style={{ scrollMarginTop: '120px', background: 'rgba(15,10,26,0.3)' }}>
          <div className="wide-container">
            <div className="text-constraint-center" style={{ textAlign: 'center', marginBottom: 80 }}>
              <h2 className="section-title">Switch without breaking your shop</h2>
              <p style={{ fontSize: 18, color: '#a1a1aa', marginTop: 16 }}>Migration safety for repair shops that can't afford downtime.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
              {[
                { emoji: "🔄", h: "Keep your workflow", p: "Fixology adapts to your intake style. No forced changes to how you operate." },
                { emoji: "⚡", h: "Onboard in 1 day", p: "Templates + presets get you running fast. No weeks of configuration required." },
                { emoji: "🔒", h: "Data stays yours", p: "Exports, audit logs, role permissions. You own every bit of data you generate." }
              ].map((card, i) => (
                <div key={i} className="glass-card" style={{ padding: 40 }}>
                  <div style={{ fontSize: 40, marginBottom: 24 }}>{card.emoji}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{card.h}</h3>
                  <p style={{ fontSize: 16, color: '#c4b5fd', lineHeight: 1.7 }}>{card.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="section-spacer" style={{ scrollMarginTop: '120px' }} id="pricing">
          <div className="wide-container">
            <div className="text-constraint-center" style={{ textAlign: 'center', marginBottom: 80 }}>
              <h2 className="section-title">Fixology Pricing</h2>
              <p style={{ fontSize: 20, color: '#c4b5fd', marginTop: 16 }}>Choose the plan that fits your shop's volume.</p>
              <p style={{ fontSize: 15, color: '#a1a1aa', marginTop: 8 }}>Monthly subscription. Cancel or upgrade anytime.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32, marginBottom: 100 }}>
              <div className="glass-card pricing-card" style={{ padding: 40, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Starter</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', marginBottom: 20 }}>$99<span style={{ fontSize: 20, color: '#a1a1aa', fontWeight: 400 }}>/mo</span></div>
                <div style={{ fontSize: 15, color: '#c4b5fd', marginBottom: 32 }}>Perfect for specialized boutique shops.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                  {["Up to 100 tickets/mo", "Full AI Diagnosis", "Basic ticketing", "Customer updates"].map((item, i) => (
                    <div key={i} style={{ fontSize: 15, color: '#fff', display: 'flex', gap: 12 }}><span style={{ color: '#4ade80' }}>✓</span> {item}</div>
                  ))}
                </div>
                <Link href="/signup" className="glow-button glow-button-secondary" style={{ width: '100%', marginTop: 40, padding: '16px 24px', display: 'block', textAlign: 'center', textDecoration: 'none' }}>Start Free Trial</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#a78bfa,#c4b5fd)', padding: '8px 24px', borderRadius: 999, fontSize: 12, fontWeight: 800, color: '#0f0a1a', whiteSpace: 'nowrap', zIndex: 10, boxShadow: '0 8px 20px rgba(167,139,250,0.4)' }}>RECOMMENDED</div>
                <div className="glass-card pricing-card pricing-card-featured" style={{ padding: 40, display: 'flex', flexDirection: 'column', height: '100%', border: '2px solid rgba(167,139,250,.4)', boxShadow: '0 0 50px rgba(167,139,250,.15)', transform: 'scale(1.05)', zIndex: 5 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Professional</div>
                  <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', marginBottom: 20 }}>$249<span style={{ fontSize: 20, color: '#a1a1aa', fontWeight: 400 }}>/mo</span></div>
                  <div style={{ fontSize: 15, color: '#c4b5fd', marginBottom: 32 }}>Our most popular plan for high-volume shops.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                    {["Unlimited tickets", "Priority AI processing", "Full Risk Intelligence", "Inventory Sync", "Priority support"].map((item, i) => (
                      <div key={i} style={{ fontSize: 15, color: '#fff', display: 'flex', gap: 12 }}><span style={{ color: '#4ade80' }}>✓</span> {item}</div>
                    ))}
                  </div>
                  <Link href="/signup" className="glow-button" style={{ width: '100%', marginTop: 40, padding: '16px 24px', display: 'block', textAlign: 'center', textDecoration: 'none' }}>Get Started Now</Link>
                </div>
              </div>
              <div className="glass-card pricing-card" style={{ padding: 40, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Enterprise</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Custom</div>
                <div style={{ fontSize: 15, color: '#c4b5fd', marginBottom: 32 }}>Custom architecture for multi-location franchises.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                  {["Multi-location dashboard", "Custom API access", "SLA guarantees", "Dedicated account manager", "On-site training"].map((item, i) => (
                    <div key={i} style={{ fontSize: 15, color: '#fff', display: 'flex', gap: 12 }}><span style={{ color: '#4ade80' }}>✓</span> {item}</div>
                  ))}
                </div>
                <button className="glow-button glow-button-secondary" style={{ width: '100%', marginTop: 40, padding: '16px 24px' }} onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact Sales</button>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING EXPLAIN DEMO (Example Tool) */}
        <section id="pricing-explain" className="section-spacer" style={{ background: 'rgba(167,139,250,.02)' }}>
          <div className="wide-container">
            <div className="text-constraint-center" style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.1em' }}>Example Tool</div>
              <h3 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 16 }}>How Fixology explains pricing to customers</h3>
              <p style={{ fontSize: 16, color: '#a1a1aa' }}>Transparent, AI-generated repair breakdowns that build immediate trust.</p>
            </div>
            <div className="glass-card" style={{ padding: 40, maxWidth: 900, margin: '0 auto', border: '1px solid rgba(167,139,250,.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div className="pricing-explain-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40 }}>
                <div>
                  <div style={{ marginBottom: 24 }}>
                    {[{ l: 'OLED Display Assembly', c: pricingBreakdown.parts }, { l: 'Technician time (45 min)', c: pricingBreakdown.labor }, { l: '90-day warranty', c: pricingBreakdown.warranty }].map((item, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(167,139,250,.1)' }}><span style={{ color: '#c4b5fd', fontSize: 15 }}>{item.l}</span><span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>${item.c}</span></div>)}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 0' }}><span style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>Total</span><span style={{ color: '#4ade80', fontSize: 24, fontWeight: 800 }}>${pricingBreakdown.total}</span></div>
                  </div>
                  <div style={{ padding: 20, background: 'rgba(167,139,250,.08)', borderRadius: 12, border: '1px solid rgba(167,139,250,.15)' }}><div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Why this price?</div><p style={{ fontSize: 14, color: '#c4b5fd', lineHeight: 1.7 }}>{pricingBreakdown.reasoning}</p></div>
                </div>
                <div className="pricing-savings" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 32, background: 'rgba(74,222,128,.08)', borderRadius: 20, border: '1px solid rgba(74,222,128,.2)' }}>
                  <div style={{ fontSize: 14, color: '#4ade80', marginBottom: 12, fontWeight: 600 }}>Customer Savings</div>
                  <div style={{ fontSize: 48, fontWeight: 800, color: '#4ade80' }}>${pricingBreakdown.competitor - pricingBreakdown.total}</div>
                  <div style={{ fontSize: 13, color: '#a1a1aa', marginTop: 8 }}>Avg competitor: ${pricingBreakdown.competitor}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bridge-text">"The best shops don't just fix devices. They keep customers informed."</div>

        {/* 6. COMMUNICATION */}
        <section ref={commRef} className="section-spacer" style={{ scrollMarginTop: '120px' }} id="communication">
          <div className="wide-container">
            <div className="asymmetric-layout" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
              <div className="text-constraint">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(167,139,250,.15)', borderRadius: 50, marginBottom: 24, border: '1px solid rgba(167,139,250,.3)' }}><span style={{ fontSize: 14 }}>💬</span><span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em' }}>Customer Updates</span></div>
                <h2 className="section-title" style={{ marginBottom: 24, textAlign: 'left' }}>Updates that write themselves</h2>
                <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 32 }}>Automatic status messages keep customers informed without technician interaction. Reduce incoming "is it ready?" phone calls by 60%.</p>
                <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(167,139,250,0.1)' }}>
                  <div style={{ color: '#4ade80', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>✓ Zero-Touch Status</div>
                  <p style={{ fontSize: 14, color: '#c4b5fd', lineHeight: 1.6 }}>Fixology monitors the repair status and sends updates precisely when milestones are hit. No manual texting required.</p>
            </div>
              </div>
              <div className="glass-card demo-container" style={{ padding: 32, minHeight: 480, maxHeight: 480, transform: 'perspective(1000px) rotateY(-2deg)', boxShadow: '0 20px 80px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {communicationMessageSets[commMessageSetIdx]?.slice(0, visibleMessages).map((msg, i) => (
                    <div key={i} className="fade-in" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#a78bfa,#c4b5fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: '0 4px 15px rgba(167,139,250,0.3)' }}>⚡</div>
                      <div style={{ flex: 1 }}>
                        <div className="msg-bubble" style={{ padding: 18, background: 'rgba(15,10,26,.7)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 16 }}>
                          <p style={{ fontSize: 15, color: '#EDE9FE', lineHeight: 1.6 }}>{msg.message}</p>
                        </div>
                        <div className="msg-meta" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: '#6b7280', padding: '0 4px' }}>
                          <span>{msg.time}</span>
                          <span style={{ color: msg.status === 'Ready' ? '#4ade80' : '#a78bfa', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>{msg.status === 'Ready' && '✓ '}{msg.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {visibleMessages === 0 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div style={{ textAlign: 'center', color: '#6b7280' }}><div style={{ fontSize: 48, marginBottom: 20, opacity: 0.5 }}>💬</div><div style={{ fontSize: 16, fontWeight: 500 }}>Customer notification triggered...</div></div></div>}
              </div>
            </div>
          </div>
        </section>

        <div className="bridge-text">"Great shops don't just react. They anticipate problems."</div>

        {/* 7. RISK */}
        <section ref={riskRef} className="section-spacer" style={{ scrollMarginTop: '120px' }} id="risk">
          <div className="wide-container">
            <div className="asymmetric-layout" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
              <div className="glass-card demo-container" style={{ padding: 32, transform: 'perspective(1000px) rotateY(2deg)', boxShadow: '0 20px 80px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {riskAlerts.slice(riskAlertIdx, riskAlertIdx + visibleAlerts).map((alert, i) => (
                    <div key={i} className={`alert-card fade-in ${alert.severity === 'high' ? 'alert-high' : alert.severity === 'medium' ? 'alert-medium' : 'alert-low'}`} style={{ padding: 20, borderRadius: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <span style={{ fontSize: 20 }}>{alert.severity === 'high' ? '🚨' : alert.severity === 'medium' ? '⚠️' : '💡'}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{alert.device}</span>
                        <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: alert.severity === 'high' ? 'rgba(239,68,68,.3)' : alert.severity === 'medium' ? 'rgba(251,191,36,.3)' : 'rgba(74,222,128,.3)', color: alert.severity === 'high' ? '#ef4444' : alert.severity === 'medium' ? '#fbbf24' : '#4ade80', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>{alert.severity}</span>
            </div>
                      <p style={{ fontSize: 14, color: '#fff', marginBottom: 10, fontWeight: 500 }}>{alert.issue}</p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>→ {alert.recommendation}</p>
              </div>
                  ))}
                </div>
                {visibleAlerts === 0 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div style={{ textAlign: 'center', color: '#6b7280' }}><div style={{ fontSize: 48, marginBottom: 20, opacity: 0.5 }}>🛡️</div><div style={{ fontSize: 16, fontWeight: 500 }}>Scanning for patterns...</div></div></div>}
              </div>
              <div className="text-constraint" style={{ marginLeft: 'auto', marginRight: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(167,139,250,.15)', borderRadius: 50, marginBottom: 24, border: '1px solid rgba(167,139,250,.3)' }}><span style={{ fontSize: 14 }}>🛡️</span><span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em' }}>Risk Detection</span></div>
                <h2 className="section-title" style={{ marginBottom: 24, textAlign: 'left' }}>Catch problem devices early</h2>
                <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 32 }}>Flags repeat customers, blacklisted devices, and unusual failure patterns before they cost you time or parts. Intelligent protection for your bottom line.</p>
                <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(239,68,68,0.1)' }}>
                  <div style={{ color: '#ef4444', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>✓ Fraud & Loss Prevention</div>
                  <p style={{ fontSize: 14, color: '#c4b5fd', lineHeight: 1.6 }}>Automatic blacklisting and "do not repair" alerts stop risky intake at the counter. Protect your technicians from bad customers.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="section-spacer" style={{ background: 'rgba(167,139,250,.03)', borderTop: '1px solid rgba(167,139,250,0.05)', borderBottom: '1px solid rgba(167,139,250,0.05)' }}>
          <div className="wide-container">
            <div className="text-constraint-center" style={{ textAlign: 'center', marginBottom: 80 }}>
              <h2 className="section-title">Trusted by repair shop owners</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 40 }}>
              {[
                { 
                  quote: "We cut our intake time in half. The AI diagnosis is scary accurate, and customers trust the pricing breakdown.", 
                  name: "Mike Chen", 
                  role: "Owner", 
                  shop: "TechFix Pro",
                  location: "Austin, TX",
                  metric: "50% faster intake",
                  avatar: "MC"
                },
                { 
                  quote: "Fewer comebacks, faster approvals, and our new techs ramp up way faster with the repair guides.", 
                  name: "Sarah Martinez", 
                  role: "Founder",
                  shop: "Device Doctors",
                  location: "Miami, FL",
                  metric: "18% fewer comebacks",
                  avatar: "SM"
                },
                {
                  quote: "The risk detection caught a blacklisted device before we even started. That alone paid for the subscription.",
                  name: "James Park",
                  role: "Owner",
                  shop: "QuickFix Mobile",
                  location: "Los Angeles, CA",
                  metric: "Zero bad devices accepted",
                  avatar: "JP"
                }
              ].map((t, i) => (
                <div key={i} className="glass-card" style={{ padding: 48, display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div style={{ fontSize: 20, color: '#fff', lineHeight: 1.8, fontStyle: 'italic', opacity: 0.9 }}>"{t.quote}"</div>
                  <div style={{ padding: '12px 16px', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8, width: 'fit-content' }}>
                    <span style={{ fontSize: 14, color: '#4ade80', fontWeight: 600 }}>✓</span>
                    <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>{t.metric}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#a78bfa,#c4b5fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#0f0a1a', boxShadow: '0 4px 15px rgba(167,139,250,0.3)' }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                      <div style={{ fontSize: 14, color: '#a78bfa', fontWeight: 600 }}>{t.role}, {t.shop}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{t.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI CALCULATOR */}
        <section id="roi-calculator" className="section-spacer" style={{ background: 'rgba(167,139,250,.02)', scrollMarginTop: '120px' }}>
          <div className="wide-container">
            <div className="text-constraint-center" style={{ textAlign: 'center', marginBottom: 60 }}>
              <h2 className="section-title">Calculate your savings</h2>
              <p style={{ fontSize: 16, color: '#a1a1aa', maxWidth: 600, margin: '16px auto 0' }}>See how Fixology impacts your bottom line</p>
            </div>
            <div className="glass-card" style={{ maxWidth: 600, margin: '0 auto', padding: 48 }}>
              <div style={{ display: 'grid', gap: 24, marginBottom: 32 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c4b5fd', marginBottom: 10 }}>
                    Repairs per month
                  </label>
                  <input
                    type="number"
                    id="roi-repairs"
                    value={roiRepairs}
                    min="1"
                    onChange={(e) => setRoiRepairs(parseInt(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'rgba(15,10,26,.6)',
                      border: '1px solid rgba(167,139,250,.2)',
                      borderRadius: 12,
                      color: '#fff',
                      fontSize: 16,
                      outline: 'none',
                      transition: 'all .3s ease'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(167,139,250,.5)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(167,139,250,.2)'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c4b5fd', marginBottom: 10 }}>
                    Average ticket value
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', fontSize: 16, fontWeight: 600 }}>$</span>
                    <input
                      type="number"
                      id="roi-ticket"
                      value={roiTicket}
                      min="1"
                      onChange={(e) => setRoiTicket(parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '14px 18px 14px 36px',
                        background: 'rgba(15,10,26,.6)',
                        border: '1px solid rgba(167,139,250,.2)',
                        borderRadius: 12,
                        color: '#fff',
                        fontSize: 16,
                        outline: 'none',
                        transition: 'all .3s ease'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'rgba(167,139,250,.5)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(167,139,250,.2)'; }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '24px', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>
                  Estimated yearly savings
                </div>
                <div style={{ fontSize: 48, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>
                  ${((roiRepairs * roiTicket * 0.12 * 12).toLocaleString('en-US', { maximumFractionDigits: 0 }))}
                </div>
                <div style={{ fontSize: 13, color: '#c4b5fd', lineHeight: 1.6 }}>
                  Based on 2+ hours saved daily, 18% fewer comebacks, and faster approvals
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 24, fontStyle: 'italic' }}>
                * Calculator is for estimation only. Actual savings may vary.
              </p>
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section id="comparison" className="section-spacer" style={{ scrollMarginTop: '120px' }}>
          <div className="wide-container">
            <div className="text-constraint-center" style={{ textAlign: 'center', marginBottom: 60 }}>
              <h2 className="section-title">Fixology vs Traditional POS</h2>
              <p style={{ fontSize: 16, color: '#a1a1aa', maxWidth: 600, margin: '16px auto 0' }}>Built for repair shops, not retail</p>
            </div>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <div className="comparison-table-wrap" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(167,139,250,.2)' }}>
                      <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '.1em' }}>Feature</th>
                      <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.1em' }}>Traditional POS</th>
                      <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '.1em' }}>Fixology</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(167,139,250,.1)' }}>
                        <td style={{ padding: '20px 24px', fontSize: 15, fontWeight: 600, color: '#fff' }}>{row.feature}</td>
                        <td style={{ padding: '20px 24px', textAlign: 'center', fontSize: 14, color: '#6b7280' }}>{row.traditional}</td>
                        <td style={{ padding: '20px 24px', textAlign: 'center', fontSize: 14, color: '#4ade80', fontWeight: 600 }}>{row.fixology}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="comparison-cards" style={{ display: 'none', padding: 20 }}>
                <div style={{ display: 'grid', gap: 12 }}>
                  {comparisonRows.map((row, i) => (
                    <div key={i} style={{ padding: 16, borderRadius: 16, background: 'rgba(167,139,250,.05)', border: '1px solid rgba(167,139,250,.14)' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{row.feature}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(15,10,26,.55)', border: '1px solid rgba(167,139,250,.12)' }}>
                          <div style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Traditional</div>
                          <div style={{ fontSize: 13, color: '#c4b5fd' }}>{row.traditional}</div>
                        </div>
                        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.22)' }}>
                          <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Fixology</div>
                          <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 700 }}>{row.fixology}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section-spacer" style={{ background: 'rgba(167,139,250,.02)', scrollMarginTop: '120px' }}>
          <div className="wide-container">
            <div className="text-constraint-center" style={{ textAlign: 'center', marginBottom: 60 }}>
              <h2 className="section-title">Frequently asked questions</h2>
              <p style={{ fontSize: 16, color: '#a1a1aa', maxWidth: 600, margin: '16px auto 0' }}>Everything you need to know</p>
            </div>
            <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  q: 'Does this replace my POS?',
                  a: 'No. Fixology works alongside your existing POS system. We handle repair-specific workflows (diagnostics, risk detection, customer updates) while your POS handles payments and inventory basics. Many shops use Fixology for repair operations and keep their POS for checkout.'
                },
                {
                  q: 'How long does setup take?',
                  a: 'About 60 seconds. No complex integrations or data migration. You create an account, add your shop details, and start creating tickets. Our AI learns from your repair patterns over time, but you can use it immediately.'
                },
                {
                  q: 'What if the AI is wrong?',
                  a: 'Fixology shows confidence scores and multiple possible causes. You\'re always in control—review the suggestions, choose what makes sense, or override with your own diagnosis. The system learns from your corrections to improve over time.'
                },
                {
                  q: 'Can I keep my workflow?',
                  a: 'Yes. Fixology adapts to how you work. Use it for intake only, or for full ticket management. Skip features you don\'t need. The system is designed to reduce friction, not force a new process.'
                },
                {
                  q: 'What devices does it support?',
                  a: 'All major devices: iPhones, Android phones, tablets, laptops, gaming consoles, and more. The AI recognizes device models, common issues, and repair patterns across all device types.'
                },
                {
                  q: 'Is my data secure?',
                  a: 'Yes. All data is encrypted in transit and at rest. We follow industry-standard security practices and never share your customer or repair data with third parties. You can export your data anytime.'
                }
              ].map((faq, i) => {
                const open = faqOpen === i;
                return (
                  <div key={i} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <button
                      onClick={() => setFaqOpen(open ? null : i)}
                      style={{
                        width: '100%',
                        padding: '24px 28px',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        transition: 'all .3s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(167,139,250,.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', flex: 1 }}>{faq.q}</span>
                      <span style={{ fontSize: 20, color: '#a78bfa', transition: 'transform .3s ease', transform: open ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                    </button>
                    {open && (
                      <div style={{ padding: '0 28px 24px', fontSize: 14, color: '#c4b5fd', lineHeight: 1.7 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-spacer" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="glow-spot" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.6 }} />
          <div className="wide-container">
            <div className="text-constraint-center" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 64, marginBottom: 32 }}>🚀</div>
              <h2 className="section-title" style={{ marginBottom: 24, fontSize: 'clamp(36px, 5vw, 64px)' }}>See how it all connects</h2>
              <p style={{ fontSize: 20, color: '#a1a1aa', marginBottom: 48 }}>Two minutes. Real scenarios. You decide if it fits.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                <button className="glow-button" style={{ padding: '20px 48px', fontSize: 18 }}>🔍 See a Diagnosis</button>
                <button className="glow-button glow-button-secondary" style={{ padding: '20px 48px', fontSize: 18 }}>💬 Talk to Someone</button>
              </div>
            </div>
          </div>
        </section>

        {/* TALK TO THE FIXOLOGY TEAM */}
        <section id="contact" className="section-spacer" style={{ scrollMarginTop: '120px', background: 'rgba(15,10,26,0.4)', position: 'relative', overflow: 'hidden' }}>
          <div className="glow-spot" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.5 }} />
          <div className="wide-container">
            <div className="text-constraint-center" style={{ textAlign: 'center', marginBottom: 80 }}>
              <h2 className="section-title" style={{ fontSize: 'clamp(36px,5vw,64px)', marginBottom: 24 }}>Talk to the Fixology Team</h2>
              <p style={{ fontSize: 20, color: '#c4b5fd', maxWidth: 700, margin: '0 auto' }}>For serious repair shops that want fewer mistakes, faster tickets, and cleaner operations.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 40, marginBottom: 80, alignItems: 'stretch' }}>
              {/* LEFT COLUMN - Call Appointment */}
              <div className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', border: '1px solid rgba(167,139,250,.2)', boxShadow: '0 8px 30px rgba(167,139,250,.15)', minHeight: '100%' }}>
                <div style={{ fontSize: 20, marginBottom: 12 }}>📞</div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Book a 20-minute call</h3>
                <p style={{ fontSize: 14, color: '#c4b5fd', lineHeight: 1.6, marginBottom: 20 }}>
                  Let's connect for a quick 10–15 minute discovery call to explore how Fixology can boost your sales and cut costs.<br />
                  Answering a few questions helps us tailor our response to your shop.<br />
                  This information is confidential and not shared outside of Fixology.
                </p>

                {scheduleSuccess ? (
                  <div role="alert" aria-live="polite" style={{ padding: 24, background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.3)', borderRadius: 12, textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }} aria-hidden="true">✓</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#4ade80', marginBottom: 4 }}>Call request sent.</div>
                      <div style={{ fontSize: 13, color: '#c4b5fd', lineHeight: 1.6 }}>
                        Got it. Check your email. We’ll confirm the call within 1 business day.
                      </div>
                    <button
                      onClick={() => {
                        setScheduleSuccess(false);
                          setScheduleForm({ name: '', email: '', shopName: '', phone: '', honey: '' });
                        setSelectedDate('');
                        setSelectedTime('');
                        setScheduleFormErrors({});
                      }}
                      style={{
                        marginTop: 12,
                        padding: '8px 16px',
                        fontSize: 12,
                        background: 'transparent',
                        border: '1px solid rgba(74,222,128,.3)',
                        borderRadius: 8,
                        color: '#4ade80',
                        cursor: 'pointer',
                        transition: 'all .2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,222,128,.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      Schedule another call
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Honeypot */}
                    <input
                      type="text"
                      name="company"
                      value={scheduleForm.honey}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, honey: e.target.value })}
                      style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                    {/* Form Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#c4b5fd', marginBottom: 6 }}>
                          Full name <span style={{ color: '#ef4444', fontSize: 10 }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={scheduleForm.name}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(15,10,26,.6)',
                            border: '1px solid rgba(167,139,250,.2)',
                            borderRadius: 10,
                            color: '#fff',
                            fontSize: 14,
                            outline: 'none',
                            transition: 'all .3s ease',
                            height: 42
                          }}
                          onFocus={(e) => { e.target.style.borderColor = 'rgba(167,139,250,.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(167,139,250,.2)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>

                      <div>
                        <label htmlFor="schedule-phone" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#c4b5fd', marginBottom: 6 }}>
                          Phone <span style={{ color: '#ef4444', fontSize: 10 }}>*</span>
                        </label>
                        <input
                          id="schedule-phone"
                          type="tel"
                          required
                          value={scheduleForm.phone}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            setScheduleForm({ ...scheduleForm, phone: formatted });
                            if (scheduleFormErrors.phone) {
                              setScheduleFormErrors({ ...scheduleFormErrors, phone: undefined });
                            }
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = scheduleFormErrors.phone ? 'rgba(239,68,68,.5)' : 'rgba(167,139,250,.2)';
                            e.target.style.boxShadow = 'none';
                            if (!validatePhone(e.target.value) && e.target.value) {
                              setScheduleFormErrors({ ...scheduleFormErrors, phone: 'Please enter a valid phone number' });
                            }
                          }}
                          placeholder="(555) 123-4567"
                          aria-invalid={!!scheduleFormErrors.phone}
                          aria-describedby={scheduleFormErrors.phone ? 'phone-error' : undefined}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(15,10,26,.6)',
                            border: `1px solid ${scheduleFormErrors.phone ? 'rgba(239,68,68,.5)' : 'rgba(167,139,250,.2)'}`,
                            borderRadius: 10,
                            color: '#fff',
                            fontSize: 14,
                            outline: 'none',
                            transition: 'all .3s ease',
                            height: 42
                          }}
                          onFocus={(e) => { 
                            e.target.style.borderColor = scheduleFormErrors.phone ? 'rgba(239,68,68,.6)' : 'rgba(167,139,250,.5)'; 
                            e.target.style.boxShadow = `0 0 0 3px ${scheduleFormErrors.phone ? 'rgba(239,68,68,.1)' : 'rgba(167,139,250,.1)'}`; 
                          }}
                        />
                        {scheduleFormErrors.phone && (
                          <p id="phone-error" style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{scheduleFormErrors.phone}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="schedule-email" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#c4b5fd', marginBottom: 6 }}>
                          Email <span style={{ color: '#ef4444', fontSize: 10 }}>*</span>
                        </label>
                        <input
                          id="schedule-email"
                          type="email"
                          required
                          value={scheduleForm.email}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, email: e.target.value })}
                          placeholder="your@email.com"
                          aria-label="Email address"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(15,10,26,.6)',
                            border: `1px solid ${scheduleFormErrors.email ? 'rgba(239,68,68,.5)' : 'rgba(167,139,250,.2)'}`,
                            borderRadius: 10,
                            color: '#fff',
                            fontSize: 14,
                            outline: 'none',
                            transition: 'all .3s ease',
                            height: 42
                          }}
                          onFocus={(e) => { e.target.style.borderColor = scheduleFormErrors.email ? 'rgba(239,68,68,.6)' : 'rgba(167,139,250,.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = scheduleFormErrors.email ? 'rgba(239,68,68,.5)' : 'rgba(167,139,250,.2)'; e.target.style.boxShadow = 'none'; if (scheduleFormErrors.email && validateEmail(scheduleForm.email)) setScheduleFormErrors({ ...scheduleFormErrors, email: undefined }); }}
                        />
                        <p style={{ fontSize: 10, color: '#6b7280', marginTop: 4, lineHeight: 1.4 }}>
                          We'll send confirmation to your email if provided
                        </p>
                        {scheduleFormErrors.email && (
                          <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{scheduleFormErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#c4b5fd', marginBottom: 6 }}>
                          Shop name <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={scheduleForm.shopName}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, shopName: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(15,10,26,.6)',
                            border: '1px solid rgba(167,139,250,.2)',
                            borderRadius: 10,
                            color: '#fff',
                            fontSize: 14,
                            outline: 'none',
                            transition: 'all .3s ease',
                            height: 42
                          }}
                          onFocus={(e) => { e.target.style.borderColor = 'rgba(167,139,250,.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(167,139,250,.2)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </div>

                    {/* Date Picker */}
                    <div style={{ marginBottom: 16 }}>
                      <label htmlFor="schedule-date" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(196,181,253,.9)', marginBottom: 10 }}>
                        Select a date
                      </label>
                      <input
                        id="schedule-date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                        min={new Date().toISOString().split('T')[0]}
                  max={(() => {
                    const maxDate = new Date();
                    maxDate.setDate(maxDate.getDate() + 14);
                    return maxDate.toISOString().split('T')[0];
                  })()}
                        aria-label="Select date for call"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: 'rgba(15,10,26,.6)',
                          border: '1px solid rgba(167,139,250,.25)',
                          borderRadius: 10,
                          color: '#fff',
                          fontSize: 14,
                          outline: 'none',
                          transition: 'all .3s ease',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          height: 42
                        }}
                        onFocus={(e) => { e.target.style.borderColor = 'rgba(167,139,250,.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(167,139,250,.25)'; e.target.style.boxShadow = 'none'; }}
                      />
                      <p style={{ fontSize: 10, color: '#6b7280', marginTop: 4, lineHeight: 1.4 }}>
                        Available up to 14 days in advance
                      </p>
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (() => {
                      const generateTimeSlots = () => {
                        const slots: string[] = [];
                        const startHour = 10;
                        const endHour = 18;
                        const slotInterval = 20; // minutes
                        
                        for (let hour = startHour; hour < endHour; hour++) {
                          for (let minute = 0; minute < 60; minute += slotInterval) {
                            const time = new Date();
                            time.setHours(hour, minute, 0, 0);
                            const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                            slots.push(timeStr);
                          }
                        }
                        
                        // Filter out past times for today
                        const today = new Date().toISOString().split('T')[0];
                        if (selectedDate === today) {
                          const now = new Date();
                          return slots.filter(slot => {
                            const [time, period] = slot.split(' ');
                            const [hours, minutes] = time.split(':').map(Number);
                            let slotHour = hours;
                            if (period === 'PM' && hours !== 12) slotHour += 12;
                            if (period === 'AM' && hours === 12) slotHour = 0;
                            const slotTime = new Date();
                            slotTime.setHours(slotHour, minutes, 0, 0);
                            return slotTime > now;
                          });
                        }
                        return slots;
                      };

                      const timeSlots = generateTimeSlots();
                      const isWeekend = (() => {
                        const date = new Date(selectedDate);
                        const day = date.getDay();
                        return day === 0 || day === 6;
                      })();

                      if (isWeekend) {
                        return (
                          <div role="alert" style={{ marginBottom: 16, padding: 12, background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.18)', borderRadius: 10, textAlign: 'center' }}>
                            <p style={{ fontSize: 13, color: 'rgba(196,181,253,.7)' }}>We schedule calls Monday–Friday. Please select a weekday.</p>
                          </div>
                        );
                      }
                      
                      if (timeSlots.length === 0) {
                        return (
                          <div role="alert" style={{ marginBottom: 16, padding: 12, background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.18)', borderRadius: 10, textAlign: 'center' }}>
                            <p style={{ fontSize: 13, color: 'rgba(196,181,253,.7)' }}>No available times for today. Please select another date.</p>
                          </div>
                        );
                      }

                      return (
                        <div style={{ marginBottom: 16 }}>
                          <label htmlFor="schedule-time" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(196,181,253,.9)', marginBottom: 10 }}>
                            Available times
                          </label>
                          <div 
                            id="schedule-time"
                            role="group"
                            aria-label="Select time slot"
                            style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', 
                              gap: 8, 
                              maxHeight: 200, 
                              overflowY: 'auto', 
                              padding: '4px',
                              scrollbarWidth: 'thin',
                              scrollbarColor: 'rgba(167,139,250,.3) transparent'
                            }}
                          >
                            {timeSlots.map((time) => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setSelectedTime(time)}
                                aria-pressed={selectedTime === time}
                                aria-label={`Select ${time}`}
                                style={{
                                  padding: '8px 12px',
                                  fontSize: 13,
                                  borderRadius: 10,
                                  border: selectedTime === time ? '1px solid rgba(167,139,250,.45)' : '1px solid rgba(167,139,250,.18)',
                                  background: selectedTime === time ? 'rgba(167,139,250,.14)' : 'rgba(167,139,250,.08)',
                                  color: 'rgba(196,181,253,.9)',
                                  cursor: 'pointer',
                                  transition: 'all .2s ease',
                                  outline: 'none',
                                  boxShadow: selectedTime === time ? '0 0 0 2px rgba(167,139,250,.2)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedTime !== time) {
                                    e.currentTarget.style.background = 'rgba(167,139,250,.12)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedTime !== time) {
                                    e.currentTarget.style.background = 'rgba(167,139,250,.08)';
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedTime(time);
                                  }
                                }}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Submit Button */}
                    <button
                      onClick={async () => {
                        // Validate before submit
                        const errors: {name?: string; phone?: string; email?: string} = {};
                        if (!scheduleForm.name.trim()) {
                          errors.name = 'Name is required';
                        }
                        if (!scheduleForm.phone || !validatePhone(scheduleForm.phone)) {
                          errors.phone = 'Valid phone number is required';
                        }
                        if (!scheduleForm.email || !validateEmail(scheduleForm.email)) {
                          errors.email = 'Valid email is required';
                        }
                        
                        if (Object.keys(errors).length > 0) {
                          setScheduleFormErrors(errors);
                          return;
                        }
                        
                        if (!selectedDate || !selectedTime) return;
                        
                        setScheduleSubmitting(true);
                        setScheduleError('');
                        setScheduleFormErrors({});
                        
                        try {
                          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                          const res = await fetch('/api/contact', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              type: 'call',
                              source: 'homepage',
                              fullName: scheduleForm.name.trim(),
                              email: scheduleForm.email.trim(),
                              shopName: scheduleForm.shopName.trim() || '',
                              phone: scheduleForm.phone.replace(/\D/g, ''),
                              date: `${selectedDate} ${selectedTime} (${tz})`,
                              honey: scheduleForm.honey || ''
                            })
                          });
                          
                          let data: any = null;
                          try {
                            data = await res.json();
                          } catch (parseErr) {
                            // If response isn't valid JSON (e.g., platform error page), treat as generic failure
                          }
                          
                          if (!res.ok || !data?.ok) {
                            throw new Error((data && data.error) || 'Failed to schedule call');
                          }
                          
                          setScheduleSuccess(true);
                          setScheduleForm({ name: '', email: '', shopName: '', phone: '', honey: '' });
                          setSelectedDate('');
                          setSelectedTime('');
                          setScheduleFormErrors({});
                        } catch (err: any) {
                          setScheduleError(err.message || 'Couldn\'t book that time. Try another slot.');
                        } finally {
                          setScheduleSubmitting(false);
                        }
                      }}
                      disabled={!scheduleForm.name.trim() || !scheduleForm.phone || !validatePhone(scheduleForm.phone) || !scheduleForm.email || !validateEmail(scheduleForm.email) || !selectedDate || !selectedTime || scheduleSubmitting}
                      className="glow-button"
                      aria-label={scheduleSubmitting ? 'Submitting call request' : 'Schedule call'}
                      style={{
                        width: '100%',
                        padding: '14px 24px',
                        fontSize: 15,
                        marginBottom: 8,
                        border: 'none',
                        cursor: (!scheduleForm.name.trim() || !scheduleForm.phone || !validatePhone(scheduleForm.phone) || !selectedDate || !selectedTime) ? 'not-allowed' : 'pointer',
                        opacity: (!scheduleForm.name.trim() || !scheduleForm.phone || !validatePhone(scheduleForm.phone) || !selectedDate || !selectedTime) ? 0.6 : 1,
                        transition: 'all .2s ease'
                      }}
                    >
                      {scheduleSubmitting ? 'Confirming…' : (selectedDate && selectedTime ? 'Confirm call →' : 'Schedule call →')}
                    </button>

                    {scheduleError && (
                      <div role="alert" aria-live="assertive" style={{ marginBottom: 8, padding: 12, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontSize: 12, color: '#ef4444', flex: 1 }}>{scheduleError}</p>
                          <button
                            onClick={() => {
                              setScheduleError('');
                              setScheduleSubmitting(false);
                            }}
                            aria-label="Dismiss error"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: 16,
                              lineHeight: 1,
                              padding: 0,
                              opacity: 0.7,
                              flexShrink: 0
                            }}
                          >
                            ×
                          </button>
                        </div>
                        {scheduleError.includes('time') && (
                          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                            Try selecting a different time slot or date.
                          </p>
                        )}
                      </div>
                    )}

                    <p style={{ fontSize: 11, color: 'rgba(196,181,253,.55)', lineHeight: 1.4, textAlign: 'center', marginBottom: 16 }}>
                      Times shown in your local timezone. We'll confirm the exact time within 1 business day.
                    </p>
                  </>
                )}
              </div>

              {/* RIGHT COLUMN - Contact Form */}
              <div className="glass-card" style={{ padding: 48, display: 'flex', flexDirection: 'column', border: '1px solid rgba(167,139,250,.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 32, marginBottom: 20 }}>✉️</div>
                <h3 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Send us an inquiry</h3>
                <p style={{ fontSize: 16, color: '#c4b5fd', lineHeight: 1.7, marginBottom: 32 }}>Have a question or want to learn more? Send us a message and a Fixology team member will reply.</p>
                
                {contactSuccess ? (
                  <div role="alert" aria-live="polite" style={{ padding: 32, background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.3)', borderRadius: 16, textAlign: 'center', margin: 'auto 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>Message received</div>
                    <div style={{ fontSize: 15, color: '#c4b5fd', lineHeight: 1.6, marginBottom: 24 }}>Got it. Check your email.<br />We’ll reply within 1 business day.</div>
                    <button
                      onClick={() => {
                        setContactSuccess(false);
                        setContactForm({ name: '', shopName: '', email: '', phone: '', message: '', honey: '' });
                        setContactError('');
                      }}
                      style={{
                        padding: '12px 24px',
                        fontSize: 14,
                        background: 'transparent',
                        border: '1px solid rgba(74,222,128,.3)',
                        borderRadius: 10,
                        color: '#4ade80',
                        cursor: 'pointer',
                        transition: 'all .2s ease'
                      }}
                    >
                      Send another inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setContactSubmitting(true);
                    setContactError('');
                    try {
                      const res = await fetch('/api/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'inquiry',
                          source: 'homepage',
                          fullName: contactForm.name.trim(),
                          email: contactForm.email.trim(),
                          phone: contactForm.phone ? contactForm.phone.replace(/\D/g, '') : undefined,
                          shopName: contactForm.shopName.trim() || undefined,
                          message: contactForm.message.trim(),
                          honey: contactForm.honey || ''
                        })
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to send inquiry');
                      setContactSuccess(true);
                    } catch (err: any) {
                      setContactError(err.message);
                    } finally {
                      setContactSubmitting(false);
                    }
                  }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <input
                      type="text"
                      name="company"
                      value={contactForm.honey}
                      onChange={(e) => setContactForm({ ...contactForm, honey: e.target.value })}
                      style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                    <div className="contact-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                          Full name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          style={{ width: '100%', padding: '14px 16px', background: 'rgba(15,10,26,.6)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                          Shop name
                        </label>
                        <input
                          value={contactForm.shopName}
                          onChange={(e) => setContactForm({ ...contactForm, shopName: e.target.value })}
                          placeholder="Your shop"
                          style={{ width: '100%', padding: '14px 16px', background: 'rgba(15,10,26,.6)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Email <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        style={{ width: '100%', padding: '14px 16px', background: 'rgba(15,10,26,.6)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Message <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="How can we help?"
                        rows={4}
                        style={{ width: '100%', padding: '14px 16px', background: 'rgba(15,10,26,.6)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none', resize: 'none' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={contactSubmitting}
                      className="glow-button"
                      style={{ width: '100%', padding: '18px', fontSize: 16, marginTop: 'auto' }}
                    >
                      {contactSubmitting ? 'Sending...' : 'Send Inquiry →'}
                    </button>
                    {contactError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 12, textAlign: 'center' }}>{contactError}</p>}
                  </form>
                )}
              </div>
            </div>

            {/* Trust Strip */}
            <div style={{ padding: '40px 60px', background: 'rgba(167,139,250,.05)', border: '1px solid rgba(167,139,250,.15)', borderRadius: 24, backdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40, textAlign: 'center' }}>
                {["Insurance-ready workflows", "POS-friendly architecture", "Inventory + supplier integrations", "Built for multi-location scale"].map((text, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#4ade80', fontSize: 24 }}>✓</span>
                    <span style={{ fontSize: 15, color: '#fff', fontWeight: 600, opacity: 0.9 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MOBILE STICKY BOTTOM BAR */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '12px 16px',
          background: 'rgba(15,10,26,.98)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(167,139,250,.2)',
          display: 'none',
          gap: 12,
          transition: 'transform .3s ease',
          transform: pastHero ? 'translateY(0)' : 'translateY(120%)',
          pointerEvents: pastHero ? 'auto' : 'none',
        }}
        className="mobile-sticky-bar"
        >
          <button
            className="glow-button"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ flex: 1, padding: '14px 20px', fontSize: 15, fontWeight: 600 }}
          >
            Get Started
          </button>
          <a
            href="tel:+15551234567"
            className="glow-button glow-button-secondary"
            style={{ flex: 1, padding: '14px 20px', fontSize: 15, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Call Us
          </a>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 768px) {
            .mobile-sticky-bar { display: flex !important; }
            .sticky-cta-desktop { display: none !important; }
            /* Reserve space so the fixed mobile bar doesn't cover content (forms/footer). */
            body { padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px)) !important; }
            /* Safe area padding for iOS home indicator. */
            .mobile-sticky-bar { padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important; }
            /* Extra guard: never show the desktop marketing nav on mobile (even if utility CSS fails/caches). */
            [data-marketing-desktop-nav] { display: none !important; }
            /* Comparison: cards on mobile, table hidden. */
            .comparison-table-wrap { display: none !important; }
            .comparison-cards { display: block !important; }

            /* Inventory: cards on mobile, grid hidden. */
            .inv-desktop { display: none !important; }
            .inv-mobile { display: block !important; }
          }
          @media (min-width: 769px) {
            .mobile-sticky-bar { display: none !important; }
            body { padding-bottom: 0 !important; }
            .comparison-table-wrap { display: block !important; }
            .comparison-cards { display: none !important; }

            .inv-desktop { display: block !important; }
            .inv-mobile { display: none !important; }
          }
        ` }} />

        {/* FOOTER */}
        <footer style={{ padding: '80px 0 40px', borderTop: '1px solid rgba(167,139,250,.1)', background: 'rgba(15,10,26,0.5)' }}>
          <div className="wide-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#a78bfa,#c4b5fd)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 15px rgba(167,139,250,0.2)' }}>⚡</div>
                <span style={{ fontSize: 18, color: 'rgba(196,181,253,0.9)', fontWeight: 700, letterSpacing: '-0.01em' }}>Fixology AI</span>
              </div>
              <div style={{ display: 'flex', gap: 40 }}>
                {['Privacy', 'Terms', 'Contact'].map(i => (
                  <a key={i} href={`/${i.toLowerCase()}`} className="nav-link" style={{ padding: '8px 16px', fontSize: 15, fontWeight: 600 }}>{i}</a>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 60, textAlign: 'center', fontSize: 14, color: 'rgba(196,181,253,0.3)', borderTop: '1px solid rgba(167,139,250,0.05)', paddingTop: 40 }}>
              &copy; {new Date().getFullYear()} Fixology Repair Intelligence. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
      <FixoWidget />
    </>
    </FixoProvider>
  );
}