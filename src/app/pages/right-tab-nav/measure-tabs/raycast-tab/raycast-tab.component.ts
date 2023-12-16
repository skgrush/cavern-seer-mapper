import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RaycastDistanceMode, RaycastDistanceToolService } from '../../../../shared/services/tools/raycast-distance-tool.service';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LengthPipe } from "../../../../shared/pipes/length.pipe";
import { VectorPipe } from "../../../../shared/pipes/vector.pipe";

@Component({
  selector: 'mapper-raycast-tab',
  standalone: true,
  templateUrl: './raycast-tab.component.html',
  styleUrl: './raycast-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatListModule, FormsModule, CommonModule, MatButtonToggleModule, LengthPipe, VectorPipe]
})
export class RaycastTabComponent {
  protected readonly RaycastDistanceMode = RaycastDistanceMode;
  protected readonly raycastDistanceTool = inject(RaycastDistanceToolService);

  readonly modes = new Map(
    Object.values(RaycastDistanceMode)
      .filter((val): val is RaycastDistanceMode => typeof val === 'number')
      .map(mode => [mode, RaycastDistanceMode[mode]]),
  );
}
