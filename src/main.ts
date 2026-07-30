import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';
bootstrapApplication(AppComponent,{providers:[provideRouter(routes,withComponentInputBinding()),provideHttpClient(withInterceptors([authInterceptor])),provideAnimationsAsync()]}).catch(console.error);
