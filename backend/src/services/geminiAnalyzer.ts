import { GoogleGenerativeAI } from '@google/generative-ai';

interface ExtractedTask {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  tags?: string[];
}

interface GeminiAnalysisResult {
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  openQuestions: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  tasks: ExtractedTask[];
}

const normalizePriority = (priority?: string): 'low' | 'medium' | 'high' | 'urgent' => {
  const value = (priority || 'medium').toLowerCase();
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'urgent') {
    return value;
  }
  return 'medium';
};

const normalizeStatus = (status?: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' => {
  const value = (status || 'pending').toLowerCase();
  if (value === 'pending' || value === 'in_progress' || value === 'completed' || value === 'cancelled') {
    return value;
  }
  return 'pending';
};

const parseJsonResponse = (rawContent: string): GeminiAnalysisResult | null => {
  const direct = rawContent.trim();
  try {
    return JSON.parse(direct) as GeminiAnalysisResult;
  } catch {
    // Continue to fenced JSON fallback.
  }
  const match = direct.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (!match?.[1]) {
    return null;
  }
  try {
    return JSON.parse(match[1].trim()) as GeminiAnalysisResult;
  } catch {
    return null;
  }
};

const fallbackFromTranscript = (transcript: string): GeminiAnalysisResult => {
  const shortText = transcript.slice(0, 600);
  return {
    executiveSummary: shortText || 'Transcript was provided but model output could not be parsed.',
    keyPoints: shortText ? ['Transcript received and stored.'] : [],
    decisions: [],
    openQuestions: [],
    sentiment: 'neutral',
    tasks: [],
  };
};

/** Default timeout for Gemini API calls in milliseconds (60s). */
const GEMINI_FETCH_TIMEOUT_MS = parseInt(process.env.GEMINI_FETCH_TIMEOUT_MS || '60000', 10);

export const analyzeTranscriptWithGemini = async (transcript: string): Promise<GeminiAnalysisResult> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in environment (get one at https://aistudio.google.com/apikey)');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.2,
    },
  });

  const prompt = `You are an expert meeting analyst. Return ONLY valid JSON with keys: executiveSummary (string), keyPoints (string[]), decisions (string[]), openQuestions (string[]), sentiment (positive|neutral|negative), tasks (array). Each task must include title, optional description, optional assignee, optional dueDate in ISO date yyyy-mm-dd when explicit, priority (low|medium|high|urgent), status (pending|in_progress|completed|cancelled), and optional tags string[]. Do not wrap in markdown.

Analyze this meeting transcript and produce structured output:

${transcript}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_FETCH_TIMEOUT_MS);

  let content: string;
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }, { signal: controller.signal });
    content = result.response.text();
  } catch (error: any) {
    if (error?.message?.includes('AbortError') || error?.name === 'AbortError') {
      throw new Error('Gemini API request timed out after 60s');
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown Gemini API error';
    console.error('Gemini API error:', errorMessage);
    throw new Error(`Gemini API error: ${errorMessage}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!content || content.trim().length === 0) {
    return fallbackFromTranscript(transcript);
  }

  const parsed = parseJsonResponse(content) || fallbackFromTranscript(transcript);

  return {
    executiveSummary: parsed.executiveSummary || '',
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.filter(Boolean) : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions.filter(Boolean) : [],
    openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions.filter(Boolean) : [],
    sentiment:
      parsed.sentiment === 'positive' || parsed.sentiment === 'negative' || parsed.sentiment === 'neutral'
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
