import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CanvasComponent } from "./pages/canvas/canvas.component";
import { SidenavComponent } from "./shared/components/sidenav/sidenav.component";
import { ToolsBarComponent } from './shared/components/tools-bar/tools-bar.component';
import { RightTabNavComponent } from "./pages/right-tab-nav/right-tab-nav.component";

@Component({
  selector: 'mapper-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, RouterOutlet, CanvasComponent, MatSidenavModule, MatButtonModule, MatIconModule, SidenavComponent, ToolsBarComponent, RightTabNavComponent]
})
export class AppComponent {
}
