import { Injectable } from "@angular/core";
import { openDB } from "idb";
import type { RecoverySnapshot } from "../flyer.models";
@Injectable({ providedIn: "root" })
export class FlyerRecoveryService {
  private async db() {
    return openDB("sanctuary-drafts", 3, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("flyers"))
          db.createObjectStore("flyers");
      },
    });
  }
  async put(value: RecoverySnapshot) {
    (await this.db()).put("flyers", value, value.flyerId);
  }
  async get(id: string) {
    return (await this.db()).get("flyers", id) as Promise<
      RecoverySnapshot | undefined
    >;
  }
  async remove(id: string) {
    await (await this.db()).delete("flyers", id);
  }
}
