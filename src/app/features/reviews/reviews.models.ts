export type ReviewContentType =
  | "theme"
  | "sermon"
  | "prayer"
  | "declaration"
  | "flyer"
  | "video"
  | "social_post";
export type ReviewStatus =
  "pending" | "in_review" | "changes_requested" | "approved" | "rejected";
export type ReviewPriority = "low" | "normal" | "high";

export interface ReviewAllowedActions {
  approve: boolean;
  reject: boolean;
  requestChanges: boolean;
  assign: boolean;
  comment: boolean;
}
export interface ReviewQueueItem {
  id: string;
  contentId: string;
  contentType: ReviewContentType;
  title: string;
  ownerId: string;
  ownerName: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  priority: ReviewPriority;
  dueAt?: string | null;
  status: ReviewStatus;
  publishingAuthorizationStatus?: string | null;
  submittedAt: string;
  updatedAt: string;
}
export interface ReviewVersion {
  id: string;
  versionNumber: number;
  content: unknown;
  formattedContent?: string | null;
  createdAt: string;
  createdByName?: string | null;
}
export interface ReviewComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}
export interface ReviewAuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  organizationId: string;
  timestamp: string;
  correlationId?: string | null;
  action: string;
  summary: string;
}
export interface ReviewDetail extends ReviewQueueItem {
  previousVersion?: ReviewVersion | null;
  proposedVersion: ReviewVersion;
  comments: ReviewComment[];
  auditHistory: ReviewAuditEntry[];
  allowedActions: ReviewAllowedActions;
}
export interface ReviewQueueFilters {
  contentType?: ReviewContentType;
  assignee?: string;
  priority?: ReviewPriority;
  dueAt?: string;
}
export interface ReviewDecisionRequest {
  comment?: string;
  reason?: string;
}
export interface AssignReviewRequest {
  assigneeId: string;
}
export interface AddReviewCommentRequest {
  body: string;
}
export interface EligibleReviewer {
  id: string;
  name: string;
}
