import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, NgIf, UpperCasePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { ToolManagerService } from '../../shared/services/tool-manager.service';
import { CanvasService } from '../../shared/services/canvas.service';
import { LengthPipe } from '../../shared/pipes/length.pipe';
import { MaterialManagerService } from '../../shared/services/materials/material-manager.service';

@Component({
  selector: 'mapper-tools-bar',
  standalone: true,
  imports: [MatButtonToggleModule, MatButtonModule, MatIconModule, FormsModule, AsyncPipe, MatTooltipModule, NgIf, MatMenuModule, LengthPipe, UpperCasePipe],
  templateUrl: './tools-bar.component.html',
  styleUrl: './tools-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolsBarComponent {

  readonly #toolManager = inject(ToolManagerService);
  readonly #canvasService = inject(CanvasService);
  readonly #materialManager = inject(MaterialManagerService);

  readonly toolOptions = this.#toolManager.exclusiveToolOptions;
  readonly currentTool$ = this.#toolManager.currentToolId$;
  readonly nonExclusiveTools = this.#toolManager.nonExclusiveTools;

  readonly materialOptions = this.#materialManager.materialOptions;
  readonly currentMaterialType$ = this.#materialManager.currentMaterialType$;

  readonly cameraHeightRelativeToBoundingBox$ = this.#canvasService.cameraHeightRelativeToBoundingBox$;

  selectTool(id: string) {
    this.#toolManager.selectTool(id);
  }

  selectMaterial(type: string) {
    this.#materialManager.changeMaterial(type);
  }
}
