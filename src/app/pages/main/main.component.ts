import { ChangeDetectionStrategy, Component, HostBinding, HostListener, inject } from '@angular/core';
import { CompassComponent } from '../../shared/components/compass/compass.component';
import { CanvasComponent } from '../canvas/canvas.component';
import { FileUrlLoaderComponent } from '../file-url-loader/file-url-loader.component';
import { ToolsBarComponent } from '../tools-bar/tools-bar.component';
import { OpenDialogOpener } from '../../dialogs';

@Component({
  selector: 'mapper-main',
  standalone: true,
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToolsBarComponent, CompassComponent, CanvasComponent, FileUrlLoaderComponent]
})
export class MainComponent {

  readonly #openDialog = inject(OpenDialogOpener);

  @HostBinding('attr.data-draggable')
  readonly dataDraggable = 'main';

  @HostBinding('class.file-is-dragging-over')
  fileIsDraggingOver = false;

  @HostListener('dragenter', ['$event'])
  dragEnter(e: DragEvent) {
    console.debug('dragenter', e);
  }

  /**
   * @description
   * when overlay first appears this triggers with:
   *  current=mapper
   *  target=canvas (or wherever the drag came from before the overlay)
   *
   * when the mouse leave the screen:
   *  current=mapper
   *  target=drop-overlay
   *
   * when the mouse leaves to another area:
   *  current=mapper
   *  target=drop-overlay
   *
   * when the overlay appears, this triggers, BUT it has a "relatedTarget".
   * When the hover leaves the screen, "relatedTarget" is null.
   *
   * HOWEVER:
   *  Safari never has a related target...
   */
  @HostListener('dragleave', ['$event'])
  dragLeave(e: DragEvent) {
    if (e.target instanceof HTMLElement) {
      const targetDataset = e.target.dataset;
      if (targetDataset['draggable'] === 'main') {
        this.fileIsDraggingOver = false;
      }
    }
    console.debug('dragleave', {
      related: e.relatedTarget,
      target: e.target,
      current: e.currentTarget,
      leaving: !this.fileIsDraggingOver,
    });
  }

  @HostListener('dragover', ['$event'])
  dragOver(e: DragEvent) {
    if (!e.dataTransfer) {
      return;
    }
    if (e.dataTransfer.types.includes('Files')) {
      console.debug('dragOver with files');
      e.preventDefault();
      e.stopPropagation();
      this.fileIsDraggingOver = true;
    }
    else {
      console.debug('dragOver non-files:', ...e.dataTransfer.types);
    }
  }

  @HostListener('drop', ['$event'])
  drop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.fileIsDraggingOver = false;

    const files = e.dataTransfer?.files;
    if (!files?.length) {
      return;
    }

    console.info('file drop', e, files);

    this.#openDialog.importFiles$(files).subscribe();
  }
}
