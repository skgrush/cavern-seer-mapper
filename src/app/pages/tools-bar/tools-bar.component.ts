import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { ToolManagerService } from '../../shared/services/tool-manager.service';

@Component({
  selector: 'mapper-tools-bar',
  standalone: true,
  imports: [MatButtonToggleModule, MatButtonModule, MatIconModule, FormsModule, AsyncPipe, MatTooltipModule, NgIf, MatMenuModule],
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
