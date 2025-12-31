# Fixo AI Assistant (UI-only)

Fixo is Fixology’s in-app help assistant backed by a local knowledge base. This is **UI-only** (no external AI API calls).

## Files

- `fixo-knowledge-base.ts`: Knowledge articles + `searchKnowledge()`
- `fixo-chat-widget.tsx`: Chat UI + provider (`useFixo`)
- `fixo-layout.tsx`: Wrapper to mount the floating widget globally

## Enable globally

Wrap your dashboard layout with `FixoLayout`:

```tsx
import { FixoLayout } from '@/components/fixo/fixo-layout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FixoLayout>
      {children}
    </FixoLayout>
  )
}
```

## Use programmatically

```tsx
import { useFixo } from '@/components/fixo/fixo-chat-widget'

export function HelpButton() {
  const { openChat, sendMessage } = useFixo()
  return (
    <button
      onClick={() => {
        openChat()
        sendMessage('How do I create a ticket?')
      }}
    >
      Ask Fixo
    </button>
  )
}
```

