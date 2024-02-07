import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, switchMap } from 'rxjs';
import { BaseExclusiveToolService, EXCLUSIVE_TOOL_SERVICES, NONEXCLUSIVE_TOOL_SERVICES } from './tools/base-tool.service';
import { NoToolService } from './tools/no-tool.service';

@Injectable()
export class ToolManagerService {

  readonly #nonexclusiveTools = inject(NONEXCLUSIVE_TOOL_SERVICES);
  readonly #exclusiveTools = new Map(
    inject(EXCLUSIVE_TOOL_SERVICES)
      .map(tool => [tool.id, tool]),
  );
  readonly #noTool = inject(NoToolService);

  readonly #currentTool = new BehaviorSubject<BaseExclusiveToolService>(this.#noTool);
  readonly currentToolId$ = this.#currentTool.pipe(map(t => t.id));
  readonly currentToolCursor$ = this.#currentTool.pipe(switchMap(t => t.cursor$));

  readonly exclusiveToolOptions = [...this.#exclusiveTools.values()];
  readonly nonExclusiveTools = Object.freeze([...this.#nonexclusiveTools]);

  /**
   * @returns true if the new tool was successfully started, and old tool stopped
   * @returns false if either the old tool failed to stop or new tool failed to start
   */
  selectTool(toolId?: string) {
    if (!toolId) {
      toolId = this.#noTool.id;
    }

    const tool = this.#exclusiveTools.get(toolId);
    if (!tool) {
      throw new Error(`Unknown tool ${toolId}`);
    }

    if (!this.#currentTool.value.stop()) {
      return false;
    }
    if (!tool.start()) {
      return false;
    }

    this.#currentTool.next(tool);
    return true;
  }
}
