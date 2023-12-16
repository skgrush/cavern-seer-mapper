import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BehaviorSubject, map } from 'rxjs';
import { ExportService } from '../../services/export.service';
import { TransportProgressHandler } from '../../models/transport-progress-handler';
import { ModelManagerService } from '../../services/model-manager.service';
import { MatButtonModule } from '@angular/material/button';

export type IZipDownloadModelDialogData = {
  readonly titleText: string;
}

@Component({
  selector: 'mapper-zip-download-model-dialog',
  standalone: true,
  imports: [MatDialogModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule, NgIf, AsyncPipe, MatProgressBarModule, MatButtonModule],
  templateUrl: './zip-download-model-dialog.component.html',
  styleUrl: './zip-download-model-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ZipDownloadModelDialogComponent {

  readonly #exportService = inject(ExportService);
  readonly #modelManager = inject(ModelManagerService);
  readonly #dialogRef = inject<MatDialogRef<ZipDownloadModelDialogComponent, boolean>>(MatDialogRef);
  readonly #dialogData: IZipDownloadModelDialogData = inject(MAT_DIALOG_DATA);

  readonly titleText = this.#dialogData.titleText;

  readonly resultSubject = new BehaviorSubject<{
    name?: string,
    size?: number,
  } | undefined>(undefined);
  readonly errorSubject = new BehaviorSubject<any | undefined>(undefined);

  protected readonly uploadProgress = new TransportProgressHandler();

  protected readonly openModelName$ = this.#modelManager.currentOpenGroup$.pipe(
    map(model => model?.identifier ?? ''),
  );

  readonly formGroup = new FormGroup({
    compressionLevel: new FormControl(5, {
      nonNullable: true,
      validators: [
        Validators.min(1),
        Validators.max(9),
        Validators.required,
      ],
    }),
    fileName: new FormControl('', { nonNullable: true }),
  });

  static open(
    dialog: MatDialog,
    data: IZipDownloadModelDialogData,
  ) {
    return dialog.open<ZipDownloadModelDialogComponent, IZipDownloadModelDialogData, boolean>(
      ZipDownloadModelDialogComponent,
      {
        data,
      },
    );
  }

  submit(event: SubmitEvent) {
    event.preventDefault();

    if (!this.formGroup.valid || this.uploadProgress.isActive) {
      return;
    }

    this.formGroup.disable();
    const { compressionLevel, fileName } = this.formGroup.getRawValue();

    this.#dialogRef.disableClose = true;

    this.uploadProgress.reset(true);

    this.#exportService.downloadZip$(compressionLevel, fileName, this.uploadProgress)
      .subscribe({
        next: result => {
          this.uploadProgress.deactivate();
          this.resultSubject.next(result);
        },
        error: err => this.errorSubject.next(err),
        complete: () => {
          this.#dialogRef.disableClose = false;
        },
      });
  }
}
