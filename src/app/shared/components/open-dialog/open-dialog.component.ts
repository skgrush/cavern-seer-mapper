import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { filter, forkJoin, map, tap } from 'rxjs';
import { FileLoadCompleteEvent, FileLoadProgressEvent } from '../../events/file-load-events';
import { BaseRenderModel } from '../../models/render/base.render-model';
import { UploadFileModel } from '../../models/upload-file-model';
import { FileTypeService } from '../../services/file-type.service';
import { ModelLoadService } from '../../services/model-load.service';
import { FileIconComponent } from '../file-icon/file-icon.component';
import { TransportProgressHandler } from '../../models/transport-progress-handler';
import { MatButtonModule } from '@angular/material/button';

export type IOpenDialogData = {
  readonly titleText: string;
  readonly submitText: string;
  readonly multiple?: boolean;
};

@Component({
  selector: 'mapper-open-dialog',
  standalone: true,
  imports: [MatDialogModule, MatListModule, NgFor, NgIf, AsyncPipe, MatProgressBarModule, FileIconComponent, MatButtonModule],
  templateUrl: './open-dialog.component.html',
  styleUrl: './open-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenDialogComponent {

  readonly #modelService = inject(ModelLoadService);
  readonly #fileTypeService = inject(FileTypeService);
  readonly #dialogRef = inject<MatDialogRef<OpenDialogComponent, BaseRenderModel<any>[]>>(MatDialogRef);
  readonly #dialogData: IOpenDialogData = inject(MAT_DIALOG_DATA);

  readonly titleText = this.#dialogData.titleText;
  readonly submitText = this.#dialogData.submitText;
  readonly multiple = this.#dialogData.multiple;

  protected readonly uploadProgress = new TransportProgressHandler();

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

    this.files = [...this.#fileTypeService.mapFileList(event.target.files)];
  }

  clickOpen(e: SubmitEvent) {
    e.preventDefault();

    if (!this.files?.length || this.uploadProgress.isActive) {
      return;
    }

    const files = this.files;
    const totalSize = files.reduce((acc, curr) => acc + curr.blob.size, 0);

    this.#dialogRef.disableClose = true;
    this.uploadProgress.reset(true);
    this.uploadProgress.changeTotal(totalSize);
    this.uploadError = undefined;

    const fileObservables = files.map(file =>
      this.#modelService.loadFile(file, this.uploadProgress).pipe(
        map(event => {
          if (event instanceof FileLoadProgressEvent) {
            this.uploadProgress.setLoadedCount(event.loaded, file.identifier);
          }
          else if (event instanceof FileLoadCompleteEvent) {
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
          this.uploadProgress.deactivate();
          this.uploadError = err;
        }
      }),
    ).subscribe();
  }
}

