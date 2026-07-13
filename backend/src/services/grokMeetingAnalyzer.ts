type GrokRole = 'system' | 'user' | 'assistant';

interface GrokMessage {
  role: GrokRole;
  content: string;
}

interface ExtractedTask {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  tags?: string[];
}

interface GrokAnalysisResult {
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

const parseJsonResponse = (rawContent: string): GrokAnalysisResult | null => {
  const direct = rawContent.trim();

  try {
    return JSON.parse(direct) as GrokAnalysisResult;
  } catch {
    // Continue to fenced JSON fallback.
  }

  const match = direct.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (!match?.[1]) {
    return null;
  }

  try {
    return JSON.parse(match[1].trim()) as GrokAnalysisResult;
  } catch {
    return null;
  }
};

const fallbackFromTranscript = (transcript: string): GrokAnalysisResult => {
  const shortText = transcript.slice(0, 600);

  return {
    executiveSummary: shortText || 'Transcript was provided but model output could not be parsed.',
    keyPoints: shortText ? ['Transcript received and stored.'] : [],
    decisions: [],
    openQuestions: [],
    sentiment: 'neutral',
    tasks: []
  };
};

export const analyzeTranscriptWithGrok = async (transcript: string): Promise<GrokAnalysisResult> => {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  const baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
  const model = process.env.GROK_MODEL || 'grok-2-latest';

  if (!apiKey) {
    throw new Error('Missing GROK_API_KEY (or XAI_API_KEY)');
  }

  const messages: GrokMessage[] = [
    {
      role: 'system',
      content:
        'You are an expert meeting analyst. Return ONLY valid JSON with keys: executiveSummary (string), keyPoints (string[]), decisions (string[]), openQuestions (string[]), sentiment (positive|neutral|negative), tasks (array). Each task must include title, optional description, optional assignee, optional dueDate in ISO date yyyy-mm-dd when explicit, priority (low|medium|high|urgent), status (pending|in_progress|completed|cancelled), and optional tags string[]. Do not wrap in markdown.'
    },
    {
      role: 'user',
      content: `Analyze this meeting transcript and produce structured output:\n\n${transcript}`
    }
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages
    })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorDetails = `Grok API error ${response.status}: ${JSON.stringify(payload)}`;
    console.error(errorDetails);
    throw new Error(errorDetails);
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || content.trim().length === 0) {
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
          tags: Array.isArray(task.tags) ? task.tags.filter(Boolean) : []
        }))
      : []
  };
};
