import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'mapper-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, MatSidenavModule, MatButtonModule, MatIconModule, MatTooltipModule]
})
export class AppComponent {

  @HostListener('dragover', ['$event'])
  dragOver(e: DragEvent) {
    // prevent ANY form of file drop (that wasn't caught by a lower)
    e.preventDefault();
  }

  @HostListener('drop', ['$event'])
  drop(e: DragEvent) {
    console.info('drop on app', e);
    e.preventDefault();
  }
}
