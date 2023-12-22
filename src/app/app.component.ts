import { ChangeDetectionStrategy, Component, HostBinding, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CanvasComponent } from "./pages/canvas/canvas.component";
import { SidenavComponent } from "./shared/components/sidenav/sidenav.component";
import { ToolsBarComponent } from './shared/components/tools-bar/tools-bar.component';
import { RightTabNavComponent } from "./pages/right-tab-nav/right-tab-nav.component";
import { CompassComponent } from "./shared/components/compass/compass.component";
import { DialogOpenerService } from './shared/services/dialog-opener.service';

@Component({
  selector: 'mapper-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, RouterOutlet, CanvasComponent, MatSidenavModule, MatButtonModule, MatIconModule, SidenavComponent, ToolsBarComponent, RightTabNavComponent, CompassComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {

  readonly #dialogOpener = inject(DialogOpenerService);

  @HostBinding('class.file-is-dragging-over')
  fileIsDraggingOver = false;

  @HostListener('dragenter', ['$event'])
  dragEnter(e: DragEvent) {
    console.debug('dragenter', e);
  }

  /**
   * @description
   * when the overlay appears, this triggers, BUT it has a "relatedTarget".
   * When the hover leaves the screen, "relatedTarget" is null.
   */
  @HostListener('dragleave', ['$event'])
  dragLeave(e: DragEvent) {
    const leavingWindow = !e.relatedTarget;
    console.debug('dragleave', { leavingWindow });

    if (leavingWindow) {
      this.fileIsDraggingOver = false;
    }
  }

  @HostListener('dragover', ['$event'])
  dragOver(e: DragEvent) {
    if (!e.dataTransfer) {
      return;
    }
    if (e.dataTransfer.types.includes('Files')) {
      console.debug('dragOver with files');
      e.preventDefault();
      this.fileIsDraggingOver = true;
    }
    else {
      console.debug('dragOver non-files:', ...e.dataTransfer.types);
    }
  }

  @HostListener('drop', ['$event'])
  drop(e: DragEvent) {
    e.preventDefault();
    this.fileIsDraggingOver = false;

    const files = e.dataTransfer?.files;
    if (!files?.length) {
      return;
    }

    console.info('file drop', e, files);

    this.#dialogOpener.import(files);
  }
}
