# Novita AI Integration (Llama 3.3 70B)

This document describes the Novita AI integration that replaces Claude for chat features in Fixology.

## Environment Setup

Add the following to your `.env.local` file:

```bash
NOVITA_API_KEY=your_novita_api_key_here
```

Get your API key from: https://novita.ai/

## Updated Features

All chat-related features now use Novita AI (Llama 3.3 70B):

1. **Fixo Chat Widget** (`/api/fixo`)
   - Main AI assistant chat widget
   - Uses the Fixology AI system prompt
   - Located in: `components/fixo/fixo-chat-widget.tsx`

2. **Quick AI Intake** (`/api/ai/quick-intake`)
   - Natural language ticket creation
   - Extracts structured data from text descriptions
   - Returns JSON with customer, device, repair details

3. **AI Diagnostics** (`/api/ai/diagnostics`)
   - Currently uses rule-based pattern matching (not AI-powered)
   - Can be enhanced with AI in the future

## Implementation Details

### Shared Client (`lib/ai/novita-client.ts`)

A centralized client for all Novita AI calls:

```typescript
import { createChatCompletion } from '@/lib/ai/novita-client'

const result = await createChatCompletion({
  systemPrompt: 'Your system prompt here',
  messages: [{ role: 'user', content: 'Hello' }],
  maxTokens: 2000,
  temperature: 0.5,
})
```

### API Configuration

- **Model**: `meta-llama/llama-3.3-70b-instruct`
- **Base URL**: `https://api.novita.ai/openai`
- **Default Parameters**:
  - `max_tokens`: 2000
  - `temperature`: 0.5
  - `top_p`: 0.9
  - `top_k`: 40
  - `presence_penalty`: 0
  - `frequency_penalty`: 0.1
  - `repetition_penalty`: 1.1

## System Prompt

The Fixo chat widget uses a comprehensive system prompt that includes:

- Repair diagnostics expertise
- Fixology platform FAQs
- Dashboard navigation help
- Response style guidelines

See `app/api/fixo/route.ts` for the full system prompt.

## Migration Notes

- Removed dependency on `@anthropic-ai/sdk` (still in package.json but not used)
- Using existing `openai` package (already installed)
- All error handling updated to reference `NOVITA_API_KEY`
- UI components updated to show "Powered by Llama 3.3" instead of "Powered by Claude"

## Testing

1. Set `NOVITA_API_KEY` in `.env.local`
2. Restart the development server
3. Test the Fixo chat widget
4. Test quick AI intake on the dashboard
5. Verify error messages are helpful if API key is missing

## Troubleshooting

**Error: "NOVITA_API_KEY is not set"**
- Add the API key to `.env.local`
- Restart the server

**Error: "Invalid API key"**
- Verify your API key is correct
- Check for extra spaces or quotes

**Rate limiting**
- Novita AI has rate limits based on your plan
- Error messages will indicate rate limit issues
