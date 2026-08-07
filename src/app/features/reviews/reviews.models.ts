export type ReviewContentType =
  | "theme"
  | "sermon"
  | "prayer"
  | "declaration"
  | "flyer"
  | "video"
  | "social_post";
export type ApprovalStatus =
  "pending" | "in_review" | "changes_requested" | "approved" | "rejected";
export type ReviewPriority = "low" | "normal" | "high";

export interface AllowedApprovalActions {
  approve: boolean;
  reject: boolean;
  requestChanges: boolean;
  assign: boolean;
  comment: boolean;
}
export interface ApprovalSummary {
  id: string;
  contentId: string;
  contentVersionId: string;
  contentType: ReviewContentType;
  title: string;
  ownerId: string;
  ownerName: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  priority: ReviewPriority;
  dueAt?: string | null;
  status: ApprovalStatus;
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
export interface ApprovalComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}
export interface ApprovalAuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  organizationId: string;
  timestamp: string;
  correlationId?: string | null;
  action: string;
  summary: string;
}
export interface ApprovalDetail extends ApprovalSummary {
  previousVersion?: ReviewVersion | null;
  proposedVersion: ReviewVersion;
  comments: ApprovalComment[];
  auditHistory: ApprovalAuditEntry[];
  allowedActions: AllowedApprovalActions;
}
export interface ReviewQueueFilters {
  status?: ApprovalStatus;
  type?: ReviewContentType;
  assigneeId?: string;
  priority?: ReviewPriority;
  due?: string;
}
export interface SubmitForReviewRequest {
  contentId: string;
  contentType: ReviewContentType;
  contentVersionId: string;
  priority?: ReviewPriority;
  assigneeId?: string | null;
}
export interface ReviewDecisionRequest {
  comment?: string;
  reason?: string;
}
export type ApprovalDecision = "approve" | "reject" | "request-changes";

// Transitional names retained for view imports; transport and persisted models
// have one canonical definition above.
export type ReviewStatus = ApprovalStatus;
export type ReviewAllowedActions = AllowedApprovalActions;
export type ReviewQueueItem = ApprovalSummary;
export type ReviewDetail = ApprovalDetail;
export type ReviewComment = ApprovalComment;
export type ReviewAuditEntry = ApprovalAuditEntry;
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
