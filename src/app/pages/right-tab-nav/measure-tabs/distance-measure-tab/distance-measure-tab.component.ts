import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DistanceMeasureToolService } from '../../../../shared/services/tools/distance-measure-tool.service';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LengthPipe } from "../../../../shared/pipes/length.pipe";
import { VectorPipe } from "../../../../shared/pipes/vector.pipe";
import { MatSelectModule } from '@angular/material/select';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MeasureDistanceAnnotation } from '../../../../shared/models/annotations/measure-distance.annotation';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Vector3 } from 'three';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'mapper-distance-measure-tab',
  standalone: true,
  templateUrl: './distance-measure-tab.component.html',
  styleUrl: './distance-measure-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, CommonModule, MatIconModule, MatButtonModule, MatMenuModule, ReactiveFormsModule, MatSelectModule, LengthPipe, VectorPipe, MatTooltip],
})
export class DistanceMeasureTabComponent {
  readonly #dialog = inject(MatDialog);
  readonly measureTool = inject(DistanceMeasureToolService);

  readonly formGroup = new FormGroup({
    selectedMeasure: new FormControl<MeasureDistanceAnnotation | null>(null),
    selectedPoints: new FormControl<Vector3[]>([], { nonNullable: true }),
  });

  constructor() {
    this.measureTool.selectedMeasure$.pipe(
      takeUntilDestroyed(),
    ).subscribe(selectedMeasure => {
      return this.formGroup.reset(
        {
          selectedMeasure: selectedMeasure ?? null,
          selectedPoints: [],
        },
        { emitEvent: false }
      );
    });

    this.formGroup.controls.selectedMeasure.valueChanges.pipe(
      takeUntilDestroyed(),
    ).subscribe(value => {
      this.measureTool.selectMeasure(value ?? undefined);
    });
  }

  deleteMeasure() {
    const { selectedMeasure } = this.formGroup.getRawValue();
    if (!selectedMeasure) {
      return;
    }
    this.measureTool.deleteMeasure(selectedMeasure);
  }

  deleteSelectedPoints() {
    const {
      selectedMeasure,
      selectedPoints,
    } = this.formGroup.getRawValue();

    if (!selectedMeasure || !selectedPoints.length) {
      return;
    }

    this.measureTool.deletePointsFromMeasure(
      selectedMeasure,
      selectedPoints,
    );
  }

  clearSelection() {
    this.formGroup.controls.selectedPoints.reset([]);
  }

  rename() {
    const { selectedMeasure } = this.formGroup.getRawValue();

    if (!selectedMeasure) {
      return;
    }

    const oldName = selectedMeasure.identifier;
    const renameValidator: ValidatorFn = (control: AbstractControl<string>) => {
      const newName = control.value;
      if (!newName) {
        return null;
      }
      if (!this.measureTool.measureRenameIsValid(oldName, newName)) {
        return { [`Identifier ${JSON.stringify(newName)} is already in use`]: true };
      }
      return null;
    }

    import('../../../../dialogs/text-input-dialog/text-input-dialog.component')
      .then(({ TextInputDialogComponent }) =>
        TextInputDialogComponent.open(
          this.#dialog,
          {
            title: 'Rename a distance measure',
            submitText: 'Rename',
            cancelText: 'Cancel',
            fieldLabel: `Rename ${oldName}`,
            inputType: 'text',
            validators: [Validators.required, renameValidator],
          },
        ).afterClosed().subscribe(result => {
          if (!result) {
            return;
          }
          this.measureTool.renameMeasure(selectedMeasure, result);
        }),
      );
  }
}
