import { Injectable, computed, signal } from "@angular/core";
import type { ApiError, EntityId } from "../models/domain.models";

export interface ToastMessage {
  id: string;
  tone: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
}

@Injectable({ providedIn: "root" })
export class PlatformStateService {
  private readonly organizationIdState = signal<EntityId | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<ApiError | null>(null);
  private readonly notificationsState = signal<readonly ToastMessage[]>([]);
  private readonly onlineState = signal(navigator.onLine);

  readonly organizationId = this.organizationIdState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly notifications = this.notificationsState.asReadonly();
  readonly online = this.onlineState.asReadonly();
  readonly hasError = computed(() => this.errorState() !== null);

  constructor() {
    addEventListener("online", () => this.onlineState.set(true));
    addEventListener("offline", () => this.onlineState.set(false));
  }

  selectOrganization(id: EntityId): void {
    this.organizationIdState.set(id);
  }
  setLoading(loading: boolean): void {
    this.loadingState.set(loading);
  }
  setError(error: ApiError | null): void {
    this.errorState.set(error);
  }
  notify(message: Omit<ToastMessage, "id">): void {
    const toast = { ...message, id: crypto.randomUUID() };
    this.notificationsState.update((items) => [...items, toast]);
    setTimeout(() => this.dismiss(toast.id), 5000);
  }
  dismiss(id: string): void {
    this.notificationsState.update((items) =>
      items.filter((item) => item.id !== id),
    );
  }
}
