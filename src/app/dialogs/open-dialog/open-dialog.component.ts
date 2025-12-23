import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { FileIconComponent } from '../../shared/components/file-icon/file-icon.component';
import { AggregateError2 } from '../../shared/errors/aggregate.error';
import { BaseRenderModel } from '../../shared/models/render/base.render-model';
import { TransportProgressHandler } from '../../shared/models/transport-progress-handler';
import { UploadFileModel } from '../../shared/models/upload-file-model';
import { BytesPipe } from "../../shared/pipes/bytes.pipe";
import { ErrorService } from '../../shared/services/error.service';
import { FileTypeService } from '../../shared/services/file-type.service';
import { ModelLoadService } from '../../shared/services/model-load.service';

export type IOpenDialogData = {
  readonly titleText: string;
  readonly submitText: string;
  readonly multiple?: boolean;
  readonly initialFiles?: FileList;
  readonly accept?: string;
};

@Component({
  selector: 'mapper-open-dialog',
  templateUrl: './open-dialog.component.html',
  styleUrl: './open-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatListModule, NgFor, NgIf, AsyncPipe, MatProgressBarModule, FileIconComponent, MatButtonModule, BytesPipe],
})
export class OpenDialogComponent implements OnInit {

  readonly #errorService = inject(ErrorService);
  readonly #modelService = inject(ModelLoadService);
  readonly #fileTypeService = inject(FileTypeService);
  readonly #dialogRef = inject<MatDialogRef<OpenDialogComponent, BaseRenderModel<any>[]>>(MatDialogRef);
  readonly #dialogData: IOpenDialogData = inject(MAT_DIALOG_DATA);

  readonly titleText = this.#dialogData.titleText;
  readonly submitText = this.#dialogData.submitText;
  readonly multiple = this.#dialogData.multiple;
  readonly hasInitialFiles = !!this.#dialogData.initialFiles?.length;
  readonly accept = this.#dialogData.accept ?? '*/*';

  protected readonly uploadProgress = new TransportProgressHandler();

  uploadError?: any;

  readonly #files = new BehaviorSubject<UploadFileModel[] | null>(null);
  readonly files$ = this.#files.asObservable();

  static open(
    dialog: MatDialog,
    injector: Injector,
    data: IOpenDialogData,
  ) {
    return dialog.open<OpenDialogComponent, IOpenDialogData, BaseRenderModel<any>[]>(
      OpenDialogComponent,
      {
        data,
        injector,
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
      this.#modelService.loadFile(file, this.uploadProgress),
    );

    forkJoin(fileObservables).subscribe({
      next: results => {
        const errors = results.flatMap(r => r.errors);
        const successes = results.map(r => r.result).filter(x => !!x);
        if (errors.length) {
          this.#errorService.alertError(new AggregateError2(
            'While opening dialog',
            errors,
          ));
        }
        this.#dialogRef.close(successes);
      },
      error: err => {
        this.#errorService.alertError(err);
        this.#dialogRef.disableClose = false;
        this.uploadProgress.deactivate();
        this.uploadError = err;
      },
    });
  }
}
