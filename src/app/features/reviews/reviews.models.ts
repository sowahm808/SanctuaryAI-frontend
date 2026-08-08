export type ReviewContentType =
  | "theme"
  | "sermon"
  | "prayer"
  | "declaration"
  | "flyer"
  | "video"
  | "social_post";
export type ApprovalStatus = "pending" | "in_review" | "changes_requested";
export type ReviewPriority = "low" | "normal" | "high" | "urgent";

/** The actionable record returned by GET /approvals. */
export interface ApprovalQueueItem {
  id: string;
  resourceType: ReviewContentType;
  resourceId: string;
  title: string;
  subtitle?: string;
  status: ApprovalStatus;
  priority?: ReviewPriority;
  dueAt?: string;
  submittedAt?: string;
  requestedByUserId: string;
  requestedByName?: string;
  reviewerUserId?: string;
  reviewerName?: string;
  versionId?: string;
  revision?: string;
  versionLabel?: string;
  preview?: unknown;
}

export interface AllowedApprovalActions {
  approve: boolean;
  reject: boolean;
  requestChanges: boolean;
  assign: boolean;
  comment: boolean;
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
export interface ApprovalDetail extends ApprovalQueueItem {
  previousVersion?: ReviewVersion | null;
  proposedVersion: ReviewVersion;
  comments: ApprovalComment[];
  auditHistory: ApprovalAuditEntry[];
  allowedActions: AllowedApprovalActions;
}
export interface ReviewQueueFilters {
  status?: ApprovalStatus;
  type?: ReviewContentType;
  resourceType?: ReviewContentType;
  contentType?: ReviewContentType;
  priority?: ReviewPriority;
  assigneeId?: string;
  reviewerUserId?: string;
  due?: string;
  dueBy?: string;
}
export interface SubmitForReviewRequest {
  contentId: string;
  contentType: ReviewContentType;
  revision?: string | number;
  reviewerUserId?: string;
}
export interface ReviewDecisionRequest {
  reason?: string;
}
export type ApprovalDecision = "approve" | "reject" | "request-changes";
export type ReviewStatus = ApprovalStatus;
export type ReviewAllowedActions = AllowedApprovalActions;
export type ReviewQueueItem = ApprovalQueueItem;
export type ReviewDetail = ApprovalDetail;
export type ReviewComment = ApprovalComment;
export type ReviewAuditEntry = ApprovalAuditEntry;
export interface AssignReviewRequest {
  reviewerUserId?: string;
}
export interface AddReviewCommentRequest {
  body: string;
  fieldPath?: string;
  parentCommentId?: string;
}
export interface EligibleReviewer {
  id: string;
  userId?: string;
  name: string;
}
