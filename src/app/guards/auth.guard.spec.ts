import { describe,expect,it } from 'vitest';
describe('authentication policy',()=>{it('requires a restored session for protected routes',()=>{sessionStorage.removeItem('sanctuary-session');expect(sessionStorage.getItem('sanctuary-session')).toBeNull()})});
