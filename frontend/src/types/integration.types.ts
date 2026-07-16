// Re-export shared integration types
export type {
  Integration,
  CalendarConfig,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
} from '@meetiva/shared-types';

// Re-export shared enums (type-only — now a type alias, not a runtime enum)
export type { IntegrationType } from '@meetiva/shared-types';

import type { Integration } from '@meetiva/shared-types';

// ─── Frontend-only State Types ──────────────────────────────────────────────

export interface IntegrationsState {
  integrations: Integration[];
  isLoading: boolean;
  error: string | null;
}
