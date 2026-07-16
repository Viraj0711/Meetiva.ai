import type { Sentiment, ActionItemStatus, MeetingPriority } from '../lib/shared';
import { AppError } from '../lib/errors';
import { MEETING_SUMMARY_PROMPT, MEETING_MINUTES_PROMPT, TASK_EXTRACTION_PROMPT } from '../prompts';

interface ExtractedTask {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  tags?: string[];
}

interface GroqAnalysisResult {
  fullSummary: string;
  minutesContent: string;
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  openQuestions: string[];
  sentiment: Sentiment;
  tasks: ExtractedTask[];
}

const normalizePriority = (priority?: string): MeetingPriority => {
  const value = (priority || 'medium').toLowerCase();
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'urgent') {
    return value;
  }
  return 'medium';
};

const normalizeStatus = (status?: string): ActionItemStatus => {
  const value = (status || 'pending').toLowerCase();
  if (value === 'pending' || value === 'in_progress' || value === 'completed' || value === 'cancelled') {
    return value;
  }
  return 'pending';
};

const parseJsonResponse = (rawContent: string): GroqAnalysisResult | null => {
  const direct = rawContent.trim();
  try {
    return JSON.parse(direct) as GroqAnalysisResult;
  } catch {
    // Continue to fenced JSON fallback.
  }
  const match = direct.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (!match?.[1]) {
    return null;
  }
  try {
    return JSON.parse(match[1].trim()) as GroqAnalysisResult;
  } catch {
    return null;
  }
};

const fallbackFromTranscript = (transcript: string): GroqAnalysisResult => {
  const shortText = transcript.slice(0, 600);
  return {
    fullSummary: shortText || 'Transcript was provided but model output could not be parsed.',
    minutesContent: shortText || 'Transcript was provided but model output could not be parsed.',
    executiveSummary: shortText || 'Transcript was provided but model output could not be parsed.',
    keyPoints: shortText ? ['Transcript received and stored.'] : [],
    decisions: [],
    openQuestions: [],
    sentiment: 'neutral',
    tasks: [],
  };
};

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const GROQ_FETCH_TIMEOUT_MS = parseInt(process.env.GROQ_FETCH_TIMEOUT_MS || '60000', 10);

/** Auto-generate Summary only (called on upload). Single Groq call. */
export const generateSummaryOnly = async (transcript: string): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return '';

  const model = process.env.LLM_MODEL || DEFAULT_MODEL;
  const summaryPrompt = `${MEETING_SUMMARY_PROMPT}

Transcript:

${transcript}`;

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
          { role: 'system', content: 'You are an expert meeting analyst. Output a comprehensive Markdown summary.' },
          { role: 'user', content: summaryPrompt },
        ],
        temperature: 0.3,
      }),
    });
    if (!response.ok) return '';
    const data = await response.json() as { choices: { message: { content: string } }[] };
    return data.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
};

export const analyzeTranscriptWithGroq = async (transcript: string): Promise<GroqAnalysisResult> => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new AppError(502, 'Missing GROQ_API_KEY in environment (get one at https://console.groq.com/keys)');
  }

  const model = process.env.LLM_MODEL || DEFAULT_MODEL;

  const prompt = `${TASK_EXTRACTION_PROMPT}

Analyze this meeting transcript and produce structured output:

${transcript}`;

  const summaryPrompt = `${MEETING_SUMMARY_PROMPT}

Transcript:

${transcript}`;

  const minutesPrompt = `${MEETING_MINUTES_PROMPT}

Transcript:

${transcript}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_FETCH_TIMEOUT_MS);

  let content: string;
  let fullSummary = '';
  let minutesContent = '';

  // Run task extraction, summary, and minutes generation in parallel
  const [taskResponse, summaryResponse, minutesResponse] = await Promise.all([
    fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an expert meeting analyst that produces structured JSON output.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    }),
    fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an expert meeting analyst. Output a comprehensive Markdown summary.' },
          { role: 'user', content: summaryPrompt },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    }),
    fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an expert meeting analyst. Output structured meeting minutes in Markdown.' },
          { role: 'user', content: minutesPrompt },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    }),
  ]);

  try {

    // Parse task extraction response
    if (!taskResponse.ok) {
      const body = await taskResponse.text().catch(() => '');
      if (taskResponse.status === 429 || body.includes('rate_limit') || body.includes('quota')) {
        throw new AppError(429, `Groq LLM quota exceeded (${model}). Free tier allows ~200 requests/day. Try again later or check your plan at https://console.groq.com/usage.`);
      }
      throw new AppError(502, `Groq LLM API error ${taskResponse.status}: ${body.slice(0, 500)}`);
    }
    const taskData = await taskResponse.json() as { choices: { message: { content: string } }[] };
    content = taskData.choices?.[0]?.message?.content || '';

    // Parse summary response
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json() as { choices: { message: { content: string } }[] };
      fullSummary = summaryData.choices?.[0]?.message?.content || '';
    }

    // Parse minutes response
    if (minutesResponse.ok) {
      const minutesData = await minutesResponse.json() as { choices: { message: { content: string } }[] };
      minutesContent = minutesData.choices?.[0]?.message?.content || '';
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    if (error?.message?.includes('AbortError') || error?.name === 'AbortError') {
      throw new AppError(504, `Groq LLM request timed out after ${GROQ_FETCH_TIMEOUT_MS / 1000}s`);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown Groq LLM API error';
    console.error('Groq LLM API error:', errorMessage);
    throw new AppError(502, `Groq LLM API error: ${errorMessage}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!content || content.trim().length === 0) {
    return fallbackFromTranscript(transcript);
  }

  const parsed = parseJsonResponse(content) || fallbackFromTranscript(transcript);

  // Use the full markdown summary if available, otherwise fall back to executiveSummary
  if (!fullSummary && parsed.executiveSummary) {
    fullSummary = parsed.executiveSummary;
  }

  return {
    fullSummary: fullSummary || parsed.executiveSummary || '',
    minutesContent: minutesContent || parsed.executiveSummary || '',
    executiveSummary: parsed.executiveSummary || '',
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.filter(Boolean) : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions.filter(Boolean) : [],
    openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions.filter(Boolean) : [],
    sentiment:
      parsed.sentiment === 'positive' || parsed.sentiment === 'neutral' || parsed.sentiment === 'negative'
        ? parsed.sentiment
        : 'neutral',
    tasks: Array.isArray(parsed.tasks)
      ? parsed.tasks.map((task) => ({
          title: task.title || 'Untitled task',
          description: task.description,
          assignee: task.assignee,
          dueDate: task.dueDate,
          priority: normalizePriority(task.priority),
          status: normalizeStatus(task.status),
          tags: Array.isArray(task.tags) ? task.tags.filter(Boolean) : [],
        }))
      : [],
  };
};
