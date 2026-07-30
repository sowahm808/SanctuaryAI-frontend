import { inject } from '@angular/core';import { CanActivateFn,Router } from '@angular/router';import { SessionService } from '../services/session.service';
export const authGuard:CanActivateFn=()=>{const s=inject(SessionService);return s.authenticated()||inject(Router).createUrlTree(['/auth/login'])};
export const guestGuard:CanActivateFn=()=>!inject(SessionService).authenticated()||inject(Router).createUrlTree(['/app/dashboard']);
