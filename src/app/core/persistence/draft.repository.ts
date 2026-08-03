import { Injectable } from "@angular/core";
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { EntityId, IsoDateTime } from "../../models/domain.models";

export interface DraftRecord<T = unknown> {
  key: string;
  organizationId: EntityId;
  feature: string;
  entityId?: EntityId;
  payload: T;
  localRevision: number;
  serverRevision?: number;
  updatedAt: IsoDateTime;
  syncState: "local" | "syncing" | "synced" | "conflict" | "failed";
}
interface DraftDatabase extends DBSchema {
  drafts: {
    key: string;
    value: DraftRecord;
    indexes: { "by-organization": EntityId; "by-updated": IsoDateTime };
  };
  metadata: { key: string; value: { key: string; value: string } };
}

@Injectable({ providedIn: "root" })
export class DraftRepository {
  private readonly database = openDB<DraftDatabase>("sanctuary-recovery", 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("drafts")) {
        const drafts = db.createObjectStore("drafts", { keyPath: "key" });
        drafts.createIndex("by-organization", "organizationId");
        drafts.createIndex("by-updated", "updatedAt");
      }
      if (!db.objectStoreNames.contains("metadata"))
        db.createObjectStore("metadata", { keyPath: "key" });
    },
  });
  async save<T>(draft: DraftRecord<T>): Promise<void> {
    (await this.database).put("drafts", draft);
  }
  async read<T>(key: string): Promise<DraftRecord<T> | undefined> {
    return (await this.database).get("drafts", key) as Promise<
      DraftRecord<T> | undefined
    >;
  }
  async remove(key: string): Promise<void> {
    (await this.database).delete("drafts", key);
  }
  async forOrganization(
    organizationId: EntityId,
  ): Promise<readonly DraftRecord[]> {
    return (await this.database).getAllFromIndex(
      "drafts",
      "by-organization",
      organizationId,
    );
  }
  async cleanup(before: IsoDateTime): Promise<number> {
    const db: IDBPDatabase<DraftDatabase> = await this.database;
    const tx = db.transaction("drafts", "readwrite");
    let cursor = await tx.store
      .index("by-updated")
      .openCursor(IDBKeyRange.upperBound(before, true));
    let removed = 0;
    while (cursor) {
      await cursor.delete();
      removed += 1;
      cursor = await cursor.continue();
    }
    await tx.done;
    return removed;
  }
  hasConflict(local: DraftRecord, serverRevision: number): boolean {
    return (
      local.serverRevision !== undefined &&
      local.serverRevision !== serverRevision &&
      local.syncState !== "synced"
    );
  }
}
