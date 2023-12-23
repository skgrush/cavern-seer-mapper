import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BehaviorSubject, filter, forkJoin, map, tap } from 'rxjs';
import { FileLoadCompleteEvent, FileLoadProgressEvent } from '../../shared/events/file-load-events';
import { BaseRenderModel } from '../../shared/models/render/base.render-model';
import { UploadFileModel } from '../../shared/models/upload-file-model';
import { FileTypeService } from '../../shared/services/file-type.service';
import { ModelLoadService } from '../../shared/services/model-load.service';
import { FileIconComponent } from '../../shared/components/file-icon/file-icon.component';
import { TransportProgressHandler } from '../../shared/models/transport-progress-handler';
import { MatButtonModule } from '@angular/material/button';
import { BytesPipe } from "../../shared/pipes/bytes.pipe";

export type IOpenDialogData = {
  readonly titleText: string;
  readonly submitText: string;
  readonly multiple?: boolean;
  readonly initialFiles?: FileList;
};

@Component({
  selector: 'mapper-open-dialog',
  standalone: true,
  templateUrl: './open-dialog.component.html',
  styleUrl: './open-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatListModule, NgFor, NgIf, AsyncPipe, MatProgressBarModule, FileIconComponent, MatButtonModule, BytesPipe],
})
export class OpenDialogComponent implements OnInit {

  readonly #modelService = inject(ModelLoadService);
  readonly #fileTypeService = inject(FileTypeService);
  readonly #dialogRef = inject<MatDialogRef<OpenDialogComponent, BaseRenderModel<any>[]>>(MatDialogRef);
  readonly #dialogData: IOpenDialogData = inject(MAT_DIALOG_DATA);

  readonly titleText = this.#dialogData.titleText;
  readonly submitText = this.#dialogData.submitText;
  readonly multiple = this.#dialogData.multiple;
  readonly hasInitialFiles = !!this.#dialogData.initialFiles?.length;

  protected readonly uploadProgress = new TransportProgressHandler();

  uploadError?: any;

  readonly #files = new BehaviorSubject<UploadFileModel[] | null>(null);
  readonly files$ = this.#files.asObservable();

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

  ngOnInit(): void {
    const initialFiles = this.#dialogData.initialFiles;
    if (initialFiles?.length) {
      this.#files.next([...this.#fileTypeService.mapFileList(initialFiles)]);
    }
  }

  inputChanged(event: Event) {
    console.info('', event);
    if (
      !(event.target instanceof HTMLInputElement) ||
      !event.target.files?.length
    ) {
      this.#files.next([]);
      return;
    }

    this.#files.next([...this.#fileTypeService.mapFileList(event.target.files)]);
  }

  clickOpen(e: SubmitEvent) {
    e.preventDefault();

    const files = this.#files.value;
    if (!files?.length || this.uploadProgress.isActive) {
      return;
    }

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
