import { ManifestRenderModel } from "../manifest.render-model";
import type { GltfRenderModel } from "./gltf.render-model";
import type { GroupRenderModel } from "./group.render-model";
import type { ObjRenderModel } from "./obj.render-model";
import type { UnknownRenderModel } from "./unknown.render-model";

export type AnyRenderModel =
  | GltfRenderModel
  | GroupRenderModel
  | ObjRenderModel
  | UnknownRenderModel
  | ManifestRenderModel;
