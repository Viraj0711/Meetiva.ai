import { AppError } from '../lib/errors';
import { TRANSCRIPT_FORMATTING_PROMPT } from '../prompts';

// Whisper API hard limit is 25 MB.
export const WHISPER_MAX_BYTES = 25 * 1024 * 1024;

export const SUPPORTED_AUDIO_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  mp4: 'audio/mp4',
  mpeg: 'audio/mpeg',
  mpga: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  aac: 'audio/aac',
};

export const isAudioOrVideoFile = (originalname: string): boolean => {
  const ext = originalname.split('.').pop()?.toLowerCase() ?? '';
  return ext in SUPPORTED_AUDIO_TYPES;
};

export const transcribeWithWhisper = async (
  fileBuffer: Buffer,
  originalname: string,
  mimeType: string
): Promise<string> => {
  const apiKey = process.env.WHISPER_API_KEY || process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new AppError(502, 'Missing WHISPER_API_KEY or GROQ_API_KEY in environment');
  }

  if (fileBuffer.byteLength > WHISPER_MAX_BYTES) {
    throw new AppError(413,
      `File is ${(fileBuffer.byteLength / 1024 / 1024).toFixed(1)} MB. ` +
        `Whisper API accepts a maximum of 25 MB per file.`
    );
  }

  const ext = originalname.split('.').pop()?.toLowerCase() ?? 'mp3';
  const contentType = SUPPORTED_AUDIO_TYPES[ext] ?? mimeType ?? 'audio/mpeg';

  const form = new FormData();
  const fileBlob = new Blob([new Uint8Array(fileBuffer)], { type: contentType });
  form.append('file', fileBlob, originalname);
  form.append('model', 'whisper-large-v3');
  form.append('response_format', 'text');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new AppError(502, `Groq Whisper API error ${response.status}: ${text}`);
  }

  return text.trim();
};

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Post-process raw Whisper transcript through Groq LLM to add
 * speaker labels, headings, and clean formatting.
 * Falls back to raw text if formatting fails.
 */
export const formatTranscript = async (rawTranscript: string): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY || process.env.WHISPER_API_KEY;
  if (!apiKey) return rawTranscript;

  const model = process.env.LLM_MODEL || DEFAULT_MODEL;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a professional meeting transcript formatter. Output only the formatted transcript, no explanations.' },
          { role: 'user', content: `${TRANSCRIPT_FORMATTING_PROMPT}\n\nRaw Transcript:\n\n${rawTranscript}` },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn('Transcript formatting failed, using raw transcript');
      return rawTranscript;
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    const formatted = data.choices?.[0]?.message?.content?.trim();

    return formatted || rawTranscript;
  } catch {
    console.warn('Transcript formatting failed, using raw transcript');
    return rawTranscript;
  } finally {
    clearTimeout(timeoutId);
  }
};
