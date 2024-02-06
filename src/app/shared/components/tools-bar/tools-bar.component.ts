import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToolManagerService } from '../../services/tool-manager.service';
import {MatMenuModule} from "@angular/material/menu";

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
