import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RaycastDistanceMode, RaycastDistanceToolService } from '../../../../shared/services/tools/raycast-distance-tool.service';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mapper-raycast-tab',
  standalone: true,
  imports: [MatIconModule, MatListModule, FormsModule, CommonModule, MatButtonToggleModule],
  templateUrl: './raycast-tab.component.html',
  styleUrl: './raycast-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
