export type Permission =
  | "themes.create"
  | "themes.read"
  | "themes.approve"
  | "sermons.create"
  | "sermons.publish"
  | "flyers.edit"
  | "social.schedule"
  | "social.publish"
  | "users.manage"
  | "settings.manage";
export interface User {
  id: string;
  name: string;
  email: string;
  permissions: ReadonlySet<Permission>;
}
export type ContentStatus =
  | "Draft"
  | "Awaiting Approval"
  | "Approved"
  | "Scheduled"
  | "Published"
  | "Failed";
export interface CampaignSection {
  id: string;
  title: string;
  progress: number;
  status: ContentStatus;
  locked: boolean;
}
export interface ApiResponse<T> {
  data: T;
  correlationId: string;
}
