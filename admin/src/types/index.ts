export type Page = "dashboard" | "users" | "teams" | "organization" | "ai" | "logs" | "settings" | "profile";

export type StatusV = "active" | "inactive" | "suspended" | "pending" | "verified" | "ok" | "error" | "warn";

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  status: StatusV;
  storage: string;
  meetings: number;
  joined: string;
  avatar: string;
  phone?: string;
}

export interface TeamData {
  id: string;
  name: string;
  owner: string;
  members: number;
  status: StatusV;
  created: string;
  plan: string;
}

export interface LogEntry {
  id: string;
  ts: string;
  user: string;
  service: string;
  event: string;
  status: StatusV;
  latency: string;
}

export interface AIRequest {
  id: string;
  ts: string;
  user: string;
  model: string;
  tokens: number;
  latency: string;
  status: StatusV;
  cost: string;
}

export type NumRecord = Record<string, number | string>;

export interface OvPoint { label: string; users: number; meetings: number; ai: number }
export interface UGPoint { label: string; individual: number; team: number }
export interface AIPoint { label: string; gpt4: number; claude: number; llama: number }
export interface StPoint { label: string; used: number }
