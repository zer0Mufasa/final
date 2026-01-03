# Fixology AI Integration (Claude) — Cursor Prompt Guide

This repo supports multiple “AI” experiences. Some are **Claude-powered** (Anthropic), others are currently **rules-based** for reliability and offline demo mode.

## Environment Variables

Add these to `fixology-next/.env.local` and restart dev server:

```env
# Anthropic Claude (for /api/fixo and /api/ai/* LLM routes)
ANTHROPIC_API_KEY=sk-ant-...

# IMEI (optional; if missing, /api/imei/lookup returns mock data)
IMEICHECK_API_KEY=your-key-from-imeicheck.net
```

## AI Feature Matrix

| Feature | API Route | What it does | Status |
|---|---|---|---|
| Fixo Chat | `/api/fixo` (also `/api/ai/fixo`) | Conversational assistant | Claude |
| Quick Intake (LLM) | `/api/ai/quick-intake` | Natural language → ticket JSON | Claude |
| Panic Log Analyzer | `/api/ai/panic-log` | iPhone panic log → component analysis | Claude |
| Diagnostics Engine | `/api/ai/diagnostics` | Symptoms → causes/tests/parts | Rules-based (used by UI) |
| Pricing Engine | `/api/ai/pricing` | Parts/labor → breakdown + explanation | Rules-based |
| Ticket Intake (legacy) | `/api/tickets/ai-intake` | Pattern parsing → draft | Rules-based (used by UI) |

> **Model note:** Claude model IDs change over time. This repo’s Claude routes use `claude-3-haiku-20240307` (known-working in this project). If you want to upgrade the model later, update the `MODEL` constant in each route.

---

## 1) Fixo Chat

### Route
- `fixology-next/app/api/fixo/route.ts` (primary)
- `fixology-next/app/api/ai/fixo/route.ts` (alias)

### Request

```json
{ "message": "yo what's good", "history": [{ "role": "user", "content": "..." }] }
```

### Response

```json
{ "response": "…", "usage": { "input_tokens": 0, "output_tokens": 0 } }
```

---

## 2) Quick Intake (Claude)

### Route
`fixology-next/app/api/ai/quick-intake/route.ts`

### Request

```json
{ "input": "iPhone 14 Pro Max cracked screen for John Smith, quoted $279" }
```

### Response

```json
{
  "result": {
    "customer": { "name": "John Smith", "phone": null, "email": null, "isNew": true },
    "device": { "type": "iPhone", "model": "14 Pro Max", "color": null, "storage": null },
    "repair": { "issue": "Cracked screen", "symptoms": ["cracked glass"], "category": "screen" },
    "pricing": { "quoted": 279, "deposit": null },
    "priority": "normal",
    "notes": null,
    "confidence": 0.95
  },
  "raw": "{...}",
  "usage": { }
}
```

---

## 3) Panic Log Analyzer (Claude)

### Route
`fixology-next/app/api/ai/panic-log/route.ts`

### Request

```json
{ "deviceModel": "iPhone 12", "panicLog": "…paste log…" }
```

### Response
`{ "result": { ... }, "raw": "...", "usage": { ... } }`

---

## Frontend Helper Hook

### `hooks/useAI.ts`

Use this when you want a consistent client pattern for POSTing JSON to an endpoint:

```ts
const { data, loading, error, execute } = useAI({ endpoint: '/api/ai/quick-intake' })
await execute({ input: 'iPhone 14 screen for John, $199' })
```

---

## Error Handling Pattern (recommended)

- **Missing API key**: return 500 with setup instructions
- **Invalid input**: return 400 with validation error
- **Rate limit**: return 429 and “retry soon”
- **Parse errors**: return both `raw` and `result: null`

---

## IMEI Lookup

### Page
`/imei` → `fixology-next/app/(dashboard)/imei/page.tsx`

### API
`/api/imei/lookup` → `fixology-next/app/api/imei/lookup/route.ts`

- If `IMEICHECK_API_KEY` is **not** set, the API returns **mock data** (great for demos).
- If it **is** set, it calls imeicheck.net.

