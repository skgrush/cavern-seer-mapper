import { ChangeDetectionStrategy, Component, inject, Injector } from '@angular/core';
import { ExportService, modelExporterAsciis, ModelExporterNames } from '../../shared/services/export.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { BehaviorSubject, tap } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { AsyncPipe, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { BytesPipe } from '../../shared/pipes/bytes.pipe';
import { MatButton } from '@angular/material/button';

export type IExportModelDialogData = {
  readonly titleText: string;
}

@Component({
  selector: 'mapper-export-model-dialog',
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogTitle,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatButtonToggle,
    MatButtonToggleGroup,
    NgIf,
    AsyncPipe,
    BytesPipe,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    NgSwitch,
    NgSwitchCase,
  ],
  templateUrl: './export-model-dialog.component.html',
  styleUrl: './export-model-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportModelDialogComponent {
  readonly ModelExporterNames = ModelExporterNames;
  readonly modelExporterNames = Object.values(ModelExporterNames);
  readonly modelExporterAsciis: Set<ModelExporterNames | null> = modelExporterAsciis;

  readonly #exportService = inject(ExportService);
  readonly #dialogRef = inject<MatDialogRef<ExportModelDialogComponent, boolean>>(MatDialogRef);
  readonly #dialogData: IExportModelDialogData = inject(MAT_DIALOG_DATA);

  readonly titleText = this.#dialogData.titleText;

  readonly resultSubject = new BehaviorSubject<{
    name: string,
    size: number,
  } | undefined>(undefined);
  readonly errorSubject = new BehaviorSubject<any | undefined>(undefined);

  readonly formGroup = new FormGroup({
    fileName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<ModelExporterNames | null>(null, { validators: [Validators.required] }),
  });

  get wikiLink() {
    const type = this.formGroup.controls.type.value;

    const wikiBase = 'https://en.wikipedia.org/wiki/';
    switch (type) {
      case ModelExporterNames.STL:
      case ModelExporterNames.STLAscii:
        return `${wikiBase}STL_(file_format)`;
      case ModelExporterNames.PLY:
      case ModelExporterNames.PLYAscii:
        return `${wikiBase}PLY_(file_format)`;
      case ModelExporterNames.OBJ:
        return `${wikiBase}Wavefront_.obj_file`;
      case ModelExporterNames.GLTF:
      case ModelExporterNames.GLB:
        return `${wikiBase}GlTF`;
      case ModelExporterNames.USDZ:
        return `${wikiBase}Universal_Scene_Description`;
    }
    return null;
  }

  static open(
    dialog: MatDialog,
    injector: Injector,
    data: IExportModelDialogData,
  ) {
    return dialog.open<ExportModelDialogComponent, IExportModelDialogData>(
      ExportModelDialogComponent,
      {
        data,
        injector,
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

    const { fileName, type } = this.formGroup.getRawValue();

    this.#exportService.downloadModel$(fileName, type!).pipe(
      tap({
        finalize: () => {
          this.formGroup.enable();
          this.#dialogRef.disableClose = false;
        },
        next: result => this.resultSubject.next(result),
        error: err => this.errorSubject.next(err),
      }),
    ).subscribe();
  }
}
