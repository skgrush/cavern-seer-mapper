import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CanvasComponent } from "./pages/canvas/canvas.component";

@Component({
  selector: 'mapper-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, RouterOutlet, CanvasComponent, MatSidenavModule]
})
export class AppComponent {
  title = 'cavern-seer-mapper';
}
