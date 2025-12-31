# Fixo AI Assistant Setup

Fixo is now powered by Claude (Anthropic) for intelligent, context-aware responses instead of pattern matching.

## Quick Setup

### 1. Install Dependencies

```bash
npm install @anthropic-ai/sdk
```

### 2. Get Your Anthropic API Key

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy the key (starts with `sk-ant-...`)

### 3. Add to Environment Variables

Add to your `.env.local` file:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Important:** Never commit your API key to git. It's already in `.gitignore`.

### 4. Files Already Installed

The following files are already in place:
- ✅ `app/api/fixo/route.ts` - API route handler
- ✅ `components/fixo/fixo-chat-widget.tsx` - Chat UI
- ✅ `components/fixo/fixo-layout.tsx` - Layout wrapper
- ✅ Dashboard layout already wrapped with `<FixoLayout>`

### 5. Test It

1. Start your dev server: `npm run dev`
2. Open the dashboard
3. Click the floating Fixo button (bottom-right)
4. Ask a question like "How do I create a ticket?"

## Features

- **Real AI Intelligence** - Understands context and intent, not just keywords
- **Conversation History** - Remembers previous messages in the conversation
- **Error Handling** - Graceful fallbacks if API is unavailable
- **Retry Support** - Retry failed requests with one click
- **Feedback System** - Thumbs up/down for quality tracking

## Troubleshooting

**"API key not configured" error:**
- Make sure `ANTHROPIC_API_KEY` is in `.env.local`
- Restart your dev server after adding the key
- Check that the key starts with `sk-ant-`

**"Rate limited" error:**
- You've hit Anthropic's rate limits
- Wait a moment and try again
- Check your Anthropic dashboard for usage limits

**Chat not opening:**
- Check browser console for errors
- Verify the API route is accessible at `/api/fixo`
- Make sure `FixoLayout` wraps your dashboard layout

## API Costs

Anthropic charges per token:
- Input: ~$3 per 1M tokens
- Output: ~$15 per 1M tokens

Typical conversation: ~$0.001-0.01 per message

Monitor usage at [console.anthropic.com](https://console.anthropic.com)

## System Prompt

The system prompt includes comprehensive Fixology documentation:
- All features and workflows
- Menu paths and navigation
- Troubleshooting guides
- Pricing information
- Response guidelines

You can customize it in `app/api/fixo/route.ts` if needed.
