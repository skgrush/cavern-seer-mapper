import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ToolManagerService } from '../../services/tool-manager.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'mapper-tools-bar',
  standalone: true,
  imports: [MatButtonToggleModule, MatIconModule, FormsModule, AsyncPipe, MatTooltipModule],
  templateUrl: './tools-bar.component.html',
  styleUrl: './tools-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolsBarComponent {

  readonly #toolManager = inject(ToolManagerService);

  readonly toolOptions = this.#toolManager.exclusiveToolOptions;
  readonly currentTool$ = this.#toolManager.currentToolId$;

  readonly nonExclusiveTools = this.#toolManager.nonExclusiveTools;

  selectTool(id: string) {
    this.#toolManager.selectTool(id);
  }
}
