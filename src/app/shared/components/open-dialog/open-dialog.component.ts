import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FileLoadCompleteEvent, FileLoadProgressEvent, UploadFileModel, ModelService } from '../../services/model.service';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { NgFor, NgIf } from '@angular/common';
import { tap } from 'rxjs';
import { CanvasService } from '../../services/canvas.service';

@Component({
  selector: 'mapper-open-dialog',
  standalone: true,
  imports: [MatDialogModule, MatListModule, NgFor, NgIf, MatProgressBarModule],
  templateUrl: './open-dialog.component.html',
  styleUrl: './open-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenDialogComponent {

  readonly #modelService = inject(ModelService);
  readonly #canvasService = inject(CanvasService);
  readonly #dialogRef = inject<MatDialogRef<OpenDialogComponent>>(MatDialogRef<OpenDialogComponent>);

  uploadProgress?: {
    loaded: number;
    total: number;
  };
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

    if (!this.files?.length || this.uploadProgress) {
      return;
    }

    const file = this.files[0];



    console.info('clickOpen', e, this.files);

    this.#dialogRef.disableClose = true;
    this.uploadProgress = {
      loaded: 0,
      total: file.file.size,
    };
    this.uploadError = undefined;

    this.#modelService.loadFile(file).pipe(
      tap(event => {
        if (event instanceof FileLoadProgressEvent) {
          this.uploadProgress = {
            loaded: event.loaded,
            total: event.total,
          };
        }
        else if (event instanceof FileLoadCompleteEvent) {
          this.#canvasService.resetModel(event.result);
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
          this.uploadProgress = undefined;
          this.uploadError = err;
        }
      }),
    ).subscribe();
  }
}

