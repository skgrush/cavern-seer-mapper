import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CanvasComponent } from "./pages/canvas/canvas.component";
import { SidenavComponent } from "./shared/components/sidenav/sidenav.component";
import { ModelNavListComponent } from "./shared/components/model-nav-list/model-nav-list.component";

@Component({
  selector: 'mapper-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, RouterOutlet, CanvasComponent, MatSidenavModule, MatButtonModule, MatIconModule, SidenavComponent, ModelNavListComponent]
})
export class AppComponent {
}
