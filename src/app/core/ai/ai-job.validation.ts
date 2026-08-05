import type { AsyncJob } from "../../models/domain.models";

export function validJob(job: AsyncJob): boolean {
  return (
    typeof job.id === "string" &&
    ["queued", "running", "completed", "failed", "cancelled"].includes(
      job.status,
    ) &&
    Number.isFinite(job.progress) &&
    job.progress >= 0 &&
    job.progress <= 100
  );
}
