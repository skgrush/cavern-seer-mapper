import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MeasureToolService } from '../../../../shared/services/tools/measure-tool.service';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LengthPipe } from "../../../../shared/pipes/length.pipe";
import { VectorPipe } from "../../../../shared/pipes/vector.pipe";
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MeasureDistanceAnnotation } from '../../../../shared/models/annotations/measure-distance.annotation';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Vector3 } from 'three';

@Component({
  selector: 'mapper-measure-tab',
  standalone: true,
  templateUrl: './measure-tab.component.html',
  styleUrl: './measure-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, CommonModule, MatIconModule, MatButtonModule, MatMenuModule, ReactiveFormsModule, MatSelectModule, LengthPipe, VectorPipe]
})
export class MeasureTabComponent {
  readonly measureTool = inject(MeasureToolService);

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
}
