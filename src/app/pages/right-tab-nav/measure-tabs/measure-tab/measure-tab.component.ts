import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MeasureToolService } from '../../../../shared/services/tools/measure-tool.service';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { LengthPipe } from "../../../../shared/pipes/length.pipe";
import { VectorPipe } from "../../../../shared/pipes/vector.pipe";

@Component({
  selector: 'mapper-measure-tab',
  standalone: true,
  templateUrl: './measure-tab.component.html',
  styleUrl: './measure-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, CommonModule, MatIconModule, LengthPipe, VectorPipe]
})
export class MeasureTabComponent {
  readonly measureTool = inject(MeasureToolService);

  readonly total$ = this.measureTool.measures$.pipe(
    map(measures => measures.map(m => m.distance)),
    map(distances => distances.reduce((a, b) => a + b, 0)),
  )
}
