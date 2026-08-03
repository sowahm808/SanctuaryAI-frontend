import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ToastRegionComponent } from "./shared/toast-region.component";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, ToastRegionComponent],
  template: "<router-outlet /><app-toast-region />",
})
export class AppComponent {}
