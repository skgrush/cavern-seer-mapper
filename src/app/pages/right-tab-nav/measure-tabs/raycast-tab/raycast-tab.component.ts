import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RaycastDistanceMode, RaycastDistanceToolService } from '../../../../shared/services/tools/raycast-distance-tool.service';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LengthPipe } from "../../../../shared/pipes/length.pipe";
import { VectorPipe } from "../../../../shared/pipes/vector.pipe";
import { CeilingHeightAnnotation } from '../../../../shared/models/annotations/ceiling-height.annotation';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'mapper-raycast-tab',
  standalone: true,
  templateUrl: './raycast-tab.component.html',
  styleUrl: './raycast-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatListModule, MatMenuModule, FormsModule, ReactiveFormsModule, CommonModule, MatButtonToggleModule, MatButtonModule, LengthPipe, VectorPipe]
})
export class RaycastTabComponent {
  protected readonly RaycastDistanceMode = RaycastDistanceMode;
  protected readonly raycastDistanceTool = inject(RaycastDistanceToolService);

  readonly modes = new Map(
    Object.values(RaycastDistanceMode)
      .filter((val): val is RaycastDistanceMode => typeof val === 'number')
      .map(mode => [mode, RaycastDistanceMode[mode]]),
  );

  readonly ceilingHeightSelectControl = new FormControl<CeilingHeightAnnotation[]>([], { nonNullable: true });

  clearSelection() {
    this.ceilingHeightSelectControl.reset();
  }

  deleteSelectedCeilingHeight() {
    const selection = this.ceilingHeightSelectControl.value;
    this.raycastDistanceTool.deleteCeilingHeights(selection);
  }
}
