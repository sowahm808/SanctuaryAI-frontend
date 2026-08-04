import { Injectable } from "@angular/core";
import { initializeApp, getApps } from "firebase/app";
import {
  Auth,
  GoogleAuthProvider,
  UserCredential,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { environment } from "../../environments/environment";

/** Owns the Firebase SDK boundary. Provider credentials are never exposed to components. */
@Injectable({ providedIn: "root" })
export class FirebaseAuthService {
  private readonly auth: Auth;
  private readonly ready: Promise<void>;

  constructor() {
    const app =
      getApps()[0] ?? initializeApp(environment.firebase, "sanctuary-ai");
    this.auth = getAuth(app);
    this.ready = setPersistence(this.auth, browserLocalPersistence);
  }

  async login(email: string, password: string): Promise<string> {
    await this.ready;
    return this.idToken(
      await signInWithEmailAndPassword(this.auth, email, password),
    );
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<string> {
    await this.ready;
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password,
    );
    await updateProfile(credential.user, { displayName: name });
    return credential.user.getIdToken(true);
  }

  async google(): Promise<string> {
    await this.ready;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return this.idToken(await signInWithPopup(this.auth, provider));
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.ready;
    await sendPasswordResetEmail(this.auth, email);
  }

  async logout(): Promise<void> {
    await this.ready;
    await signOut(this.auth);
  }

  private idToken(credential: UserCredential): Promise<string> {
    return credential.user.getIdToken(true);
  }
}
