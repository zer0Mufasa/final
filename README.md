# Fixology v8 — Founders Edition

> The Intelligence Layer for Device Repair

![Fixology Logo](https://i.ibb.co/GfPnk0zV/preview.webp)

## Overview

Fixology is an AI-powered platform for device repair shops, providing:

- 🧠 **AI Diagnostics** — 1,200+ symptoms, 500+ causes, 98.7% accuracy
- 📱 **IMEI Intelligence** — Carrier lock, Find My, warranty, blacklist checks
- 💬 **AI Auto-Reply** — SMS, Instagram, Messenger, phone answering
- 🏪 **Website Builder** — Professional shop websites in minutes
- 💰 **Rewards Program** — Customer loyalty with 4 tiers
- 📊 **Dashboard & POS** — Complete repair shop management

## Quick Start

### Deploy to Vercel

```bash
# Clone or extract
unzip fixology-v8-complete.zip
cd fixology-v8

# Deploy
vercel --prod
```

### Local Development

```bash
# Serve locally
npx serve .

# Or use Python
python -m http.server 8000
```

## File Structure

```
fixology-v8/
├── Public Pages (25)
│   ├── index.html          # Homepage
│   ├── diagnose.html       # Customer AI diagnosis
│   ├── platform.html       # For Shops landing
│   ├── devices.html        # Device categories
│   ├── imei.html           # IMEI lookup tool
│   ├── rewards.html        # Loyalty program
│   ├── pricing.html        # Pricing tiers
│   ├── learn.html          # Academy landing
│   ├── academy.html        # Course catalog
│   ├── partners.html       # Partner program
│   ├── docs.html           # Developer docs
│   ├── api.html            # API reference
│   ├── contact.html        # Contact form
│   ├── about.html          # Company info
│   ├── login.html          # Shop login
│   ├── privacy.html        # Privacy policy
│   ├── terms.html          # Terms of service
│   ├── status.html         # System status
│   ├── changelog.html      # Release notes
│   ├── security.html       # Security info
│   ├── case-studies.html   # Success stories
│   ├── roadmap.html        # Product roadmap
│   ├── blog.html           # Blog/news
│   ├── support.html        # Support center
│   └── onboarding.html     # New user flow
│
├── Dashboard Pages (10)
│   ├── dashboard/preview.html      # Overview
│   ├── dashboard/repairs.html      # POS system
│   ├── dashboard/customers.html    # CRM
│   ├── dashboard/inventory.html    # Parts inventory
│   ├── dashboard/invoices.html     # Invoicing
│   ├── dashboard/diagnostics.html  # AI diagnostics
│   ├── dashboard/imei.html         # IMEI lookup
│   ├── dashboard/auto-reply.html   # AI messaging
│   ├── dashboard/websites.html     # Site builder
│   └── dashboard/settings.html     # Settings
│
├── Legal (1)
│   └── legal/cookies.html          # Cookie policy
│
├── Assets
│   ├── css/design-system.css       # Design tokens
│   ├── js/chat-widget.js           # AI chat widget
│   └── data/
│       ├── devices.json            # 300+ device models
│       ├── symptoms.json           # 1,200+ symptoms
│       └── rewards.json            # Rewards system
│
├── Config
│   ├── vercel.json                 # Deployment config
│   ├── README.md                   # This file
│   └── DESIGN-SYSTEM.md            # Design documentation
```

## Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Fonts**: Space Grotesk, Inter, JetBrains Mono
- **Icons**: Emoji-based (no external dependencies)
- **Hosting**: Vercel (recommended)
- **AI**: ChatGPT Custom GPT integration

## Design System

See [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) for complete documentation.

### Colors
- Primary: `#8B5CF6` (Lavender)
- Success: `#22C55E`
- Warning: `#F59E0B`
- Danger: `#EF4444`

### Typography
- Headings: Space Grotesk
- Body: Inter
- Code: JetBrains Mono

## Features

### For Customers
- AI-powered symptom triage
- Instant repair estimates
- IMEI device lookup
- Rewards program
- 24/7 AI chat support

### For Repair Shops
- 3-column POS system
- AI diagnostic suggestions
- Customer CRM
- Parts inventory management
- Automated invoicing
- Multi-channel auto-reply
- Website builder
- Analytics dashboard

## API Integration

The Fixology GPT is available at:
```
https://fixologyai.com/ai.html
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

© 2025 Fixology. All rights reserved.

## Contact

- Website: [fixologyai.com](https://fixologyai.com)
- Email: hello@fixologyai.com
- Support: support@fixologyai.com

---

Built with 🧠 by certified repair technicians.
