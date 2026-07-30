import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Permission,User } from '../models/domain.models';
@Injectable({providedIn:'root'}) export class SessionService{
 private readonly current=signal<User|null>(this.restore()); readonly user=this.current.asReadonly(); readonly authenticated=computed(()=>!!this.current());
 constructor(private readonly router:Router){}
 login(email:string){const user:User={id:crypto.randomUUID(),name:email.split('@')[0]||'Ministry leader',email,permissions:new Set<Permission>(['themes.create','themes.read','themes.approve','sermons.create','sermons.publish','flyers.edit','social.schedule','social.publish','users.manage','settings.manage'])};this.current.set(user);sessionStorage.setItem('sanctuary-session',JSON.stringify({...user,permissions:[...user.permissions]}));void this.router.navigateByUrl('/app/dashboard')}
 logout(){sessionStorage.removeItem('sanctuary-session');this.current.set(null);void this.router.navigateByUrl('/auth/login')}
 can(permission:Permission){return this.current()?.permissions.has(permission)??false}
 private restore():User|null{const raw=sessionStorage.getItem('sanctuary-session');if(!raw)return null;const parsed=JSON.parse(raw) as Omit<User,'permissions'>&{permissions:Permission[]};return {...parsed,permissions:new Set(parsed.permissions)}}
}
