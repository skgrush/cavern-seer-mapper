import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MeasureToolService } from '../../../../shared/services/tools/measure-tool.service';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { tap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { LengthPipe } from "../../../../shared/pipes/length.pipe";
import { VectorPipe } from "../../../../shared/pipes/vector.pipe";
import { MatSelectModule } from '@angular/material/select';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MeasureDistanceAnnotation } from '../../../../shared/models/annotations/measure-distance.annotation';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'mapper-measure-tab',
  standalone: true,
  templateUrl: './measure-tab.component.html',
  styleUrl: './measure-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, CommonModule, MatIconModule, ReactiveFormsModule, MatSelectModule, LengthPipe, VectorPipe]
})
export class MeasureTabComponent {
  readonly measureTool = inject(MeasureToolService);

  readonly selectedMeasureControl = new FormControl<MeasureDistanceAnnotation | null>(null);

  constructor() {
    this.measureTool.selectedMeasure$.pipe(
      takeUntilDestroyed(),
      tap(selectedMeasure => this.selectedMeasureControl.reset(
        selectedMeasure ?? null,
        { emitEvent: false },
      )),
    ).subscribe();

    this.selectedMeasureControl.valueChanges.pipe(
      takeUntilDestroyed(),
      tap()
    ).subscribe();
  }
}
