import { Injectable, inject } from '@angular/core';
import { BaseToolService, TOOL_SERVICES } from './tools/base-tool.service';
import { BehaviorSubject, map } from 'rxjs';
import { NoToolService } from './tools/no-tool.service';

@Injectable()
export class ToolManagerService {

  readonly #tools = new Map(
    inject(TOOL_SERVICES)
      .map(tool => [tool.id, tool]),
  );
  readonly #noTool = inject(NoToolService);

  readonly #currentTool = new BehaviorSubject<BaseToolService>(this.#noTool);
  readonly currentToolId$ = this.#currentTool.pipe(map(t => t.id));

  readonly toolOptions = [...this.#tools.values()]
    .map(({ id, label, icon }) => ({ id, label, icon } as const));

  /**
   * @returns true if the new tool was successfully started, and old tool stopped
   * @returns false if either the old tool failed to stop or new tool failed to start
   */
  selectTool(toolId?: string) {
    if (!toolId) {
      toolId = this.#noTool.id;
    }

    const tool = this.#tools.get(toolId);
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
