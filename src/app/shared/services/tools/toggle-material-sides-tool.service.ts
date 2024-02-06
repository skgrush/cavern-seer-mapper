import { Injectable, inject } from "@angular/core";
import {map, Observable} from "rxjs";
import { FrontSide } from "three";
import { CanvasService } from "../canvas.service";
import {BaseClickToolService, Icon$Type} from "./base-tool.service";

@Injectable()
export class ToggleMaterialSidesToolService extends BaseClickToolService {
  readonly #canvasService = inject(CanvasService);

  override readonly id = 'toggle-material-sides';
  override readonly label = 'Toggle double-sided';

  override readonly icon$ =
    this.#canvasService.materialSide$.pipe(
      map((side) => ({
          icon: 'layers',
          fontSet: side === FrontSide ? 'material-icons-outlined' : 'material-icons',
        } as const)),
    );

  override click() {
    this.#canvasService.toggleDoubleSideMaterial();
  }
}
