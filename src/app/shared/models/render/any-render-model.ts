import type { CavernSeerScanRenderModel } from './cavern-seer-scan.render-model';
import type { GltfRenderModel } from './gltf.render-model';
import type { GroupRenderModel } from './group.render-model';
import type { ObjRenderModel } from './obj.render-model';
import type { UnknownRenderModel } from './unknown.render-model';
import type { WallsRenderModel } from './walls.render-model';
import type { MtlRenderModel } from './mtl.render-model';

export type AnyRenderModel =
  | GltfRenderModel
  | GroupRenderModel
  | ObjRenderModel
  | CavernSeerScanRenderModel
  | WallsRenderModel
  | MtlRenderModel
  | UnknownRenderModel;
