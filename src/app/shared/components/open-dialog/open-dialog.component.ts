import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UploadFileModel, ModelLoadService } from '../../services/model-load.service';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { BehaviorSubject, tap } from 'rxjs';
import { CanvasService } from '../../services/canvas.service';
import { FileLoadProgressEvent, FileLoadCompleteEvent } from '../../events/file-load-events';
import { ModelManagerService } from '../../services/model-manager.service';

@Component({
  selector: 'mapper-open-dialog',
  standalone: true,
  imports: [MatDialogModule, MatListModule, NgFor, NgIf, AsyncPipe, MatProgressBarModule],
  templateUrl: './open-dialog.component.html',
  styleUrl: './open-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenDialogComponent {

  readonly #modelService = inject(ModelLoadService);
  readonly #modelManager = inject(ModelManagerService);
  readonly #canvasService = inject(CanvasService);
  readonly #dialogRef = inject<MatDialogRef<OpenDialogComponent>>(MatDialogRef<OpenDialogComponent>);

  protected readonly uploadProgress = new BehaviorSubject<{
    loaded: number;
    total: number;
  } | undefined>(undefined);
  uploadError?: any;

  files: UploadFileModel[] | null = null;

  inputChanged(event: Event) {
    console.info('', event);
    if (
      !(event.target instanceof HTMLInputElement) ||
      !event.target.files?.length
    ) {
      this.files = [];
      return;
    }

    this.files = [...this.#modelService.mapFileList(event.target.files)];
  }

  clickOpen(e: SubmitEvent) {
    e.preventDefault();

    if (!this.files?.length || this.uploadProgress.value) {
      return;
    }

    const file = this.files[0];



    console.info('clickOpen', e, this.files);

    this.#dialogRef.disableClose = true;
    this.uploadProgress.next({
      loaded: 0,
      total: file.file.size,
    });
    this.uploadError = undefined;

    this.#modelService.loadFile(file).pipe(
      tap(event => {
        if (event instanceof FileLoadProgressEvent) {
          this.uploadProgress.next({
            loaded: event.loaded,
            total: event.total,
          });
        }
        else if (event instanceof FileLoadCompleteEvent) {
          this.#modelManager.resetToNonGroupModel(event.result);
        }
      }),
      tap({
        complete: () => {
          console.info('open complete');
          this.#dialogRef.close(true);
        },
        error: (err) => {
          console.error('open error', err);
          this.#dialogRef.disableClose = false;
          this.uploadProgress.next(undefined);
          this.uploadError = err;
        }
      }),
    ).subscribe();
  }
}

