import { NgIf, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ExportService } from '../../services/export.service';
import { CanvasService } from '../../services/canvas.service';
import { BehaviorSubject, tap } from 'rxjs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

export type IExportImageDialogData = {
  readonly titleText: string;
}

@Component({
  selector: 'mapper-export-image-dialog',
  standalone: true,
  imports: [MatDialogModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule, NgIf, AsyncPipe, MatButtonModule, MatButtonToggleModule],
  templateUrl: './export-image-dialog.component.html',
  styleUrl: './export-image-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportImageDialogComponent {

  readonly #exportService = inject(ExportService);
  readonly #canvasService = inject(CanvasService);
  readonly #dialogRef = inject<MatDialogRef<ExportImageDialogComponent, boolean>>(MatDialogRef);
  readonly #dialogData: IExportImageDialogData = inject(MAT_DIALOG_DATA);

  readonly titleText = this.#dialogData.titleText;

  get scaledCanvasSize() {
    const dimensions = this.#canvasService.getRendererDimensions();
    if (!dimensions) {
      return null;
    }
    const { scaleFactor } = this.formGroup.getRawValue();
    return dimensions.clone().multiplyScalar(scaleFactor);
  }

  readonly fileTypes = ['jpeg', 'png', 'webp'] as const;
  readonly scaleFactors = [1, 2, 4, 8, 16, 32] as const;

  readonly resultSubject = new BehaviorSubject<{
    name: string,
    size: number,
  } | undefined>(undefined);
  readonly errorSubject = new BehaviorSubject<any | undefined>(undefined);

  readonly formGroup = new FormGroup({
    fileName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<typeof this.fileTypes[number]>('png', { nonNullable: true, validators: [Validators.required] }),
    scaleFactor: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(32)],
    }),
  });

  static open(
    dialog: MatDialog,
    data: IExportImageDialogData,
  ) {
    return dialog.open<ExportImageDialogComponent, IExportImageDialogData>(
      ExportImageDialogComponent,
      {
        data,
      },
    );
  }

  submit(event: SubmitEvent) {
    event.preventDefault();

    if (!this.formGroup.valid || !this.formGroup.enabled) {
      return;
    }

    this.formGroup.disable();
    this.resultSubject.next(undefined);
    this.#dialogRef.disableClose = true;

    const { fileName, scaleFactor, type } = this.formGroup.getRawValue();

    this.#exportService.downloadCanvasImage$(
      fileName,
      type,
      scaleFactor,
    ).pipe(
      tap({
        finalize: () => {
          this.formGroup.enable();
          this.#dialogRef.disableClose = false;
        }
      }),
      tap({
        next: result => this.resultSubject.next(result),
        error: err => this.errorSubject.next(err),
      }),
    ).subscribe();
  }
}

export default ExportImageDialogComponent;
