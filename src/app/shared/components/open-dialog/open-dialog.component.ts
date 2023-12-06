import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UploadFileModel, ModelLoadService } from '../../services/model-load.service';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { BehaviorSubject, catchError, combineLatest, filter, forkJoin, map, tap } from 'rxjs';
import { CanvasService } from '../../services/canvas.service';
import { FileLoadProgressEvent, FileLoadCompleteEvent } from '../../events/file-load-events';
import { ModelManagerService } from '../../services/model-manager.service';
import { BaseRenderModel } from '../../models/render/base.render-model';

export type IOpenDialogData = {
  readonly titleText: string;
  readonly submitText: string;
  readonly multiple?: boolean;
};

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
  readonly #dialogRef = inject<MatDialogRef<OpenDialogComponent, BaseRenderModel<any>[]>>(MatDialogRef);
  readonly #dialogData: IOpenDialogData = inject(MAT_DIALOG_DATA);

  readonly titleText = this.#dialogData.titleText;
  readonly submitText = this.#dialogData.submitText;
  readonly multiple = this.#dialogData.multiple;

  protected readonly uploadProgress = new BehaviorSubject<{
    loaded: number;
    total: number;
  } | undefined>(undefined);

  uploadError?: any;

  files: UploadFileModel[] | null = null;

  static open(
    dialog: MatDialog,
    data: IOpenDialogData
  ) {
    return dialog.open<OpenDialogComponent, IOpenDialogData, BaseRenderModel<any>[]>(
      OpenDialogComponent,
      {
        data,
      }
    );
  }

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

    const files = this.files;
    const totalSize = files.reduce((acc, curr) => acc + curr.file.size, 0);

    this.#dialogRef.disableClose = true;
    this.uploadProgress.next({
      loaded: 0,
      total: totalSize,
    });
    this.uploadError = undefined;

    const fileObservables = files.map(file =>
      this.#modelService.loadFile(file).pipe(
        map(event => {
          if (event instanceof FileLoadProgressEvent) {
            this.uploadProgress.next({
              loaded: event.loaded,
              total: event.total,
            });
          }
          else if (event instanceof FileLoadCompleteEvent) {
            // this.#dialogRef.close(event.result);
            return event.result;
          }
          return null;
        }),
        filter((val): val is Exclude<typeof val, null> => !!val),
      ),
    );

    forkJoin(fileObservables).pipe(
      map(results => {
        this.#dialogRef.close(results);
      }),
      tap({
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

