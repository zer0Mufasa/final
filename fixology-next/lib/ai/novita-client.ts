// lib/ai/novita-client.ts
// Novita AI client for Llama 3.3 70B

import OpenAI from 'openai'

const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct'
const BASE_URL = 'https://api.novita.ai/openai'

export function createNovitaClient() {
  const apiKey = process.env.NOVITA_API_KEY

  if (!apiKey) {
    throw new Error('NOVITA_API_KEY is not set. Add it to .env.local and restart the server.')
  }

  return new OpenAI({
    apiKey,
    baseURL: BASE_URL,
  })
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  systemPrompt: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
  responseFormat?: 'text' | 'json_object'
  model?: string
  signal?: AbortSignal
}

export async function createChatCompletion(options: ChatCompletionOptions) {
  const client = createNovitaClient()

  const {
    systemPrompt,
    messages,
    maxTokens = 2000,
    temperature = 0.5,
    responseFormat = 'text',
    model = DEFAULT_MODEL,
    signal,
  } = options

  // Build messages array with system prompt
  const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  // Novita supports a few extra sampling params that aren't in the OpenAI TS types.
  // We pass them through with a loose cast.
  const response = await (client.chat.completions as any).create(
    {
    model,
    messages: apiMessages,
    max_tokens: maxTokens,
    temperature,
    top_p: 0.9,
    min_p: 0,
    top_k: 40,
    presence_penalty: 0,
    frequency_penalty: 0.1,
    repetition_penalty: 1.1,
    response_format: responseFormat === 'json_object' ? { type: 'json_object' } : { type: 'text' },
    } as any,
    signal ? ({ signal } as any) : undefined
  )

  const content = response.choices[0]?.message?.content || ''
  const usage = response.usage

  return {
    content,
    usage,
    model,
  }
}
