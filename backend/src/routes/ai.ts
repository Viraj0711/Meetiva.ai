import { Router, Response } from 'express';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadLimiter } from '../lib/rateLimiters';
import { validate } from '../lib/validation';
import { asyncHandler } from '../lib/errors';

type GrokRole = 'system' | 'user' | 'assistant';

interface GrokMessage {
  role: GrokRole;
  content: string;
}

interface GrokChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const grokChatSchema = z.object({
  prompt: z.string().optional(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(128000).optional(),
}).refine(data => data.prompt || (Array.isArray(data.messages) && data.messages.length > 0), {
  message: 'Provide either `prompt` or a non-empty `messages` array.',
});

const router = Router();

router.post('/grok', uploadLimiter, authenticate, validate(grokChatSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    const baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
    const defaultModel = process.env.GROK_MODEL || 'grok-2-latest';

    if (!apiKey) {
      return res.status(500).json({
        message: 'Grok API key missing. Set GROK_API_KEY (or XAI_API_KEY) in backend/.env'
      });
    }

    const { prompt, messages, model, temperature, maxTokens } = req.body as z.infer<typeof grokChatSchema>;

    const normalizedMessages: GrokMessage[] =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : prompt
          ? [{ role: 'user', content: prompt }]
          : [];


    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || defaultModel,
        messages: normalizedMessages,
        ...(typeof temperature === 'number' ? { temperature } : {}),
        ...(typeof maxTokens === 'number' ? { max_tokens: maxTokens } : {})
      })
    });

    const result = (await response.json().catch(() => null)) as GrokChatCompletionResponse | null;

    if (!response.ok) {
      // Log the full error server-side for debugging, but never expose
      // API provider details (rate limits, internal error messages, etc.) to the client.
      console.error(`[Grok] API error ${response.status}:`, JSON.stringify(result));
      return res.status(502).json({
        message: 'The AI service returned an error. Please try again later.'
      });
    }

    const text = result?.choices?.[0]?.message?.content ?? '';

    // Validate Grok response structure before returning to client.
    // This catches unexpected API changes early and prevents passing
    // malformed data downstream.
    const grokResponseSchema = z.object({
      choices: z.array(z.object({
        message: z.object({
          content: z.string(),
        }).optional(),
      })).optional(),
    });
    const validation = grokResponseSchema.safeParse(result);
    if (!validation.success) {
      return res.status(502).json({
        message: 'Received an unexpected response format from the AI provider',
      });
    }

    res.json({
      text,
      raw: result
    });
  }
));

router.post('/cerebras', uploadLimiter, authenticate, validate(grokChatSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const apiKey = process.env.CEREBRAS_API_KEY;
  const baseUrl = process.env.CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1';
  const defaultModel = process.env.CEREBRAS_MODEL || 'gemma-4-9b-it';

  if (!apiKey) {
    return res.status(500).json({
      message: 'Cerebras API key missing. Set CEREBRAS_API_KEY in backend/.env'
    });
  }

  const { prompt, messages, model, temperature, maxTokens } = req.body as z.infer<typeof grokChatSchema>;

  const normalizedMessages: GrokMessage[] =
    Array.isArray(messages) && messages.length > 0
      ? messages
      : prompt
        ? [{ role: 'user', content: prompt }]
        : [];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || defaultModel,
      messages: normalizedMessages,
      ...(typeof temperature === 'number' ? { temperature } : {}),
      ...(typeof maxTokens === 'number' ? { max_tokens: maxTokens } : {})
    })
  });

  const result = (await response.json().catch(() => null)) as GrokChatCompletionResponse | null;

  if (!response.ok) {
    console.error(`[Cerebras] API error ${response.status}:`, JSON.stringify(result));
    return res.status(502).json({
      message: 'The AI service returned an error. Please try again later.'
    });
  }

  const text = result?.choices?.[0]?.message?.content ?? '';

  const cerebrasResponseSchema = z.object({
    choices: z.array(z.object({
      message: z.object({
        content: z.string(),
      }).optional(),
    })).optional(),
  });
  const validation = cerebrasResponseSchema.safeParse(result);
  if (!validation.success) {
    return res.status(502).json({
      message: 'Received an unexpected response format from the AI provider',
    });
  }

  res.json({
    text,
    raw: result
  });
}));

export default router;