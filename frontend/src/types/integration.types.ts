export enum IntegrationType {
  JIRA = 'jira',
  SLACK = 'slack',
  CALENDAR = 'calendar',
  TRELLO = 'trello',
  ASANA = 'asana',
}

// Re-export shared enums (type-only — now a type alias, not a runtime enum)
export type { IntegrationType } from '@meetiva/shared-types';

export interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export interface SlackConfig {
  workspaceId: string;
  accessToken: string;
  channelId: string;
}

export interface CalendarConfig {
  provider: 'google' | 'outlook';
  accessToken: string;
  refreshToken: string;
}

// ─── Frontend-only State Types ──────────────────────────────────────────────

export interface IntegrationsState {
  integrations: Integration[];
  isLoading: boolean;
  error: string | null;
}
