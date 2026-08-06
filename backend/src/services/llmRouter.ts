import type { Sentiment } from '../lib/shared';
import { analyzeTranscriptWithGroq, generateSummaryOnly } from './groqAnalyzer';
export { generateSummaryOnly };

export type AnalysisResult = {
  fullSummary: string;
  minutesContent: string;
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  openQuestions: string[];
  sentiment: Sentiment;
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
