import { AppError } from '../lib/errors';

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2 minutes for up to 25 MB files

  let response: Response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new AppError(502, `Groq Whisper API error ${response.status}: ${text}`);
  }

  return text.trim();
};
