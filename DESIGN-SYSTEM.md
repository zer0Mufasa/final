# Fixology Design System v8

## Brand Identity

**Name:** Fixology  
**Tagline:** The Intelligence Layer for Device Repair  
**Logo:** Transparent neural brain PNG with lavender glow  

## Color Palette

### Primary (Lavender)
```css
--lavender-50:  #F5F3FF
--lavender-100: #EDE9FE
--lavender-200: #DDD6FE
--lavender-300: #C4B5FD
--lavender-400: #A78BFA  /* Primary */
--lavender-500: #8B5CF6  /* Primary Dark */
--lavender-600: #7C3AED  /* Primary Darker */
--lavender-700: #6D28D9
--lavender-800: #5B21B6
--lavender-900: #4C1D95
```

### Surfaces (Dark Theme)
```css
--surface-0: #000000   /* Pure black */
--surface-1: #09090B   /* Body background */
--surface-2: #0F0F12   /* Cards, panels */
--surface-3: #16161A   /* Elevated surfaces */
--surface-4: #1C1C22   /* Interactive elements */
--surface-5: #232329   /* Hover states */
--surface-6: #2A2A32   /* Active states */
```

### Accent Colors
```css
--cyan-400:  #22D3EE   /* Accent highlights only */
--cyan-500:  #06B6D4
--success:   #22C55E   /* Positive states */
--warning:   #F59E0B   /* Caution states */
--danger:    #EF4444   /* Error states */
```

### Text Colors
```css
--text-primary:   #FAFAFA   /* Primary text */
--text-secondary: #A1A1AA   /* Secondary text */
--text-tertiary:  #71717A   /* Tertiary text */
--text-muted:     #52525B   /* Muted text */
--text-disabled:  #3F3F46   /* Disabled text */
```

## Typography

### Font Families
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--font-tech: 'Space Grotesk', -apple-system, system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Usage
- **Space Grotesk**: Logo wordmark, headings (h1-h3), hero text, metrics
- **Inter**: Body text, UI elements, navigation, buttons, forms
- **JetBrains Mono**: Code blocks, ticket IDs, prices, IMEI numbers

### Scale
```css
--text-xs:   12px / 1.5
--text-sm:   14px / 1.5
--text-base: 16px / 1.6
--text-lg:   18px / 1.6
--text-xl:   20px / 1.5
--text-2xl:  24px / 1.4
--text-3xl:  30px / 1.3
--text-4xl:  36px / 1.2
--text-5xl:  48px / 1.1
--text-6xl:  60px / 1.05
```

## Spacing

```css
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
--space-24: 96px
```

## Border Radius

```css
--radius-sm:   6px
--radius-md:   10px
--radius-lg:   14px
--radius-xl:   20px
--radius-2xl:  24px
--radius-full: 9999px
```

## Shadows

```css
--shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.5)
--shadow-md:  0 4px 6px rgba(0, 0, 0, 0.4)
--shadow-lg:  0 10px 15px rgba(0, 0, 0, 0.3)
--shadow-xl:  0 20px 25px rgba(0, 0, 0, 0.25)
--shadow-glow: 0 0 60px rgba(139, 92, 246, 0.15)
--shadow-glow-sm: 0 0 30px rgba(139, 92, 246, 0.2)
--shadow-glow-lg: 0 0 80px rgba(139, 92, 246, 0.25)
```

## Gradients

```css
--gradient-lavender: linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #8B5CF6 100%);
--gradient-lavender-dark: linear-gradient(135deg, #A78BFA 0%, #8B5CF6 50%, #7C3AED 100%);
--gradient-glow: radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
--gradient-hero: radial-gradient(ellipse at top, rgba(139, 92, 246, 0.2) 0%, transparent 60%);
```

## Transitions

```css
--transition-fast: 0.15s ease
--transition-base: 0.2s ease
--transition-slow: 0.3s ease
--transition-bounce: 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

## Z-Index Scale

```css
--z-dropdown:       100
--z-sticky:         200
--z-fixed:          500
--z-modal-backdrop: 900
--z-modal:          1000
--z-popover:        1100
--z-tooltip:        1200
--z-chat-widget:    9999
```

## Component Patterns

### Buttons
- **Primary**: Lavender gradient, white text, glow shadow on hover
- **Secondary**: Surface background, border, text-primary
- **Ghost**: Transparent, text-secondary, hover background
- **Danger**: Red background for destructive actions

### Cards
- Background: surface-2 or surface-3
- Border: 1px solid border-subtle
- Border-radius: radius-lg (14px) or radius-xl (20px)
- Hover: Lift effect (-4px translateY), border glow

### Forms
- Input background: surface-3
- Border: 1px solid border-default
- Focus: border-lavender-500, glow ring
- Placeholder: text-muted

### Status Pills
- Open: cyan background/text
- In Progress: lavender background/text
- Waiting: warning background/text
- Ready: success background/text
- Paid: solid success background, white text

## Responsive Breakpoints

```css
--breakpoint-sm:  640px
--breakpoint-md:  768px
--breakpoint-lg:  1024px
--breakpoint-xl:  1280px
--breakpoint-2xl: 1536px
```

## Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus states: 2px lavender-500 outline, 2px offset
- Interactive targets: Minimum 44x44px
- Reduced motion: Respect prefers-reduced-motion

## File Structure

```
fixology-v8/
├── index.html
├── diagnose.html
├── platform.html
├── devices.html
├── imei.html
├── rewards.html
├── pricing.html
├── learn.html
├── academy.html
├── partners.html
├── docs.html
├── api.html
├── contact.html
├── about.html
├── login.html
├── privacy.html
├── terms.html
├── status.html
├── changelog.html
├── security.html
├── case-studies.html
├── roadmap.html
├── blog.html
├── support.html
├── onboarding.html
├── legal/
│   └── cookies.html
├── dashboard/
│   ├── preview.html
│   ├── repairs.html
│   ├── customers.html
│   ├── inventory.html
│   ├── invoices.html
│   ├── diagnostics.html
│   ├── imei.html
│   ├── auto-reply.html
│   ├── websites.html
│   └── settings.html
├── css/
│   └── design-system.css
├── js/
│   └── chat-widget.js
├── data/
│   ├── devices.json
│   ├── symptoms.json
│   └── rewards.json
├── vercel.json
├── README.md
└── DESIGN-SYSTEM.md
```
