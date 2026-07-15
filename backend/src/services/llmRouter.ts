import { analyzeTranscriptWithGroq } from './groqAnalyzer';

export type AnalysisResult = {
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  openQuestions: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  tasks: Array<{
    title: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    priority?: string;
    status?: string;
    tags?: string[];
  }>;
};

export const analyzeTranscriptWithLLM = async (transcript: string): Promise<AnalysisResult> => {
  return analyzeTranscriptWithGroq(transcript);
};
