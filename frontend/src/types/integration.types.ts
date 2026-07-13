export enum IntegrationType {
  JIRA = 'jira',
  SLACK = 'slack',
  CALENDAR = 'calendar',
  TRELLO = 'trello',
  ASANA = 'asana',
}

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  isConnected: boolean;
  isEnabled: boolean;
  config: Record<string, unknown>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface CreateIntegrationRequest {
  type: IntegrationType;
  name: string;
  config: Record<string, unknown>;
}

export interface UpdateIntegrationRequest {
  name?: string;
  isEnabled?: boolean;
  config?: Record<string, unknown>;
}

export interface IntegrationsState {
  integrations: Integration[];
  isLoading: boolean;
  error: string | null;
}
