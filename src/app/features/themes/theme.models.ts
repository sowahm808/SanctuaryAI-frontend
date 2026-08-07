import type {
  AsyncJob,
  CursorPage,
  EntityId,
} from "../../models/domain.models";
import type { ContentWorkflowStatus } from "../workspace/workflow.service";

export const THEME_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
export type ThemeTone = "pastoral" | "prophetic" | "teaching" | "evangelistic";
export type AudienceType =
  "whole-church" | "adults" | "youth" | "families" | "leaders";
export type ThemeAudience = AudienceType;

export interface ThemeDraftForm {
  month: number | null;
  year: number | null;
  topic: string;
  mainScripture: string;
  supportingScriptures: string[];
  spiritualEmphasis: string;
  pastorNotes: string;
  previousTheme?: string;
  upcomingEvents: string[];
  tone: ThemeTone | null;
  intendedAudience: AudienceType[];
}
export interface GeneratedTheme {
  title?: string;
  themeTitle?: string;
  subtitle?: string;
  mainScripture?: string;
  scriptures?: readonly string[];
  supportingScriptures?: readonly string[];
  explanation?: string;
  pastoralIntroduction?: string;
  objectives?: readonly string[];
  weeklyTeachingDirection?: readonly string[];
  monthlyConfession?: string;
  confession?: string;
  propheticDeclaration?: string;
  hashtags?: readonly string[];
  flyerHeadline?: string;
  designConcept?: string;
}
export interface ThemeSummary {
  id: EntityId;
  title?: string;
  revision: number;
  status: ContentWorkflowStatus;
  updatedAt?: string;
}
export interface ThemeRecord extends ThemeSummary {
  currentVersionId?: EntityId;
  brief: ThemeDraftForm;
  generatedContent?: GeneratedTheme;
  approval?: ThemeApproval;
  createdAt?: string;
}
export interface ThemeTimelineEvent {
  id: EntityId;
  type?: string;
  label: string;
  timestamp: string;
  actor?: string;
  summary?: string;
  revision?: number;
  state?: "completed" | "current" | "future" | "failed" | "cancelled";
}
export interface ThemeVersion {
  id: EntityId;
  revision: number;
  createdAt: string;
  creator?: string;
  status: string;
  approvalStatus?: string;
  content?: GeneratedTheme;
  snapshot?: Record<string, unknown>;
}
export interface ThemeApproval {
  status:
    "pending" | "in_review" | "changes_requested" | "approved" | "rejected";
  reason?: string;
  reviewer?: string;
  timestamp?: string;
  comments?: string;
  approvedRevision?: number;
}
export interface ThemeComment {
  id: EntityId;
  body: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
}
export interface ApiProblem {
  message: string;
  correlationId?: string;
  status?: number;
}
export type ThemeRefinementAction =
  | "more_prophetic"
  | "more_pastoral"
  | "simplify"
  | "add_scriptures"
  | "shorten"
  | "expand"
  | "create_alternatives";
export interface ThemeRefineRequest {
  action: ThemeRefinementAction;
  expectedRevision: number;
}
export interface ThemeSaveRequest {
  brief: ThemeDraftForm;
  expectedRevision?: number;
}
export type ThemeJob = AsyncJob<{
  contentId: EntityId;
  versionId: EntityId;
  revision: number;
}>;
export type ThemePageResult = CursorPage<ThemeSummary>;
