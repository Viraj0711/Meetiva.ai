import { Router, Request, Response } from 'express';

type GrokRole = 'system' | 'user' | 'assistant';

interface GrokMessage {
  role: GrokRole;
  content: string;
}

interface GrokChatRequestBody {
  prompt?: string;
  messages?: GrokMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const router = Router();

router.post('/grok', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    const baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
    const defaultModel = process.env.GROK_MODEL || 'grok-2-latest';

    if (!apiKey) {
      return res.status(500).json({
        message: 'Grok API key missing. Set GROK_API_KEY (or XAI_API_KEY) in backend/.env'
      });
    }

    const { prompt, messages, model, temperature, maxTokens } = req.body as GrokChatRequestBody;

    const normalizedMessages: GrokMessage[] =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : prompt
          ? [{ role: 'user', content: prompt }]
          : [];

    if (normalizedMessages.length === 0) {
      return res.status(400).json({
        message: 'Provide either `prompt` or a non-empty `messages` array.'
      });
    }

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

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(response.status).json({
        message: 'Grok API request failed',
        error: result
      });
    }

    const text = result?.choices?.[0]?.message?.content ?? '';

    res.json({
      text,
      raw: result
    });
  } catch (error) {
    console.error('Grok API proxy error:', error);
    res.status(500).json({ message: 'Failed to call Grok API' });
  }
});

export default router;