import type { AbstractControl, FormGroup } from "@angular/forms";
import type { ValidationIssue } from "../../models/domain.models";

export function applyServerValidation(
  form: FormGroup,
  issues: readonly ValidationIssue[],
): void {
  for (const issue of issues) {
    const control: AbstractControl | null = form.get(issue.field);
    if (control)
      control.setErrors({ ...control.errors, server: issue.message });
    else form.setErrors({ ...form.errors, server: issue.message });
  }
}
