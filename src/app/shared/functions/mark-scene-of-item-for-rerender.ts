import type { Object3D, Scene } from "three";
import { IMapperUserData } from "../models/user-data";

/**
 * Iterate up the parent chain to the top;
 * if the top is a {@see Scene}, mark it as `needsReRender`.
 */
export function markSceneOfItemForReRender(o: Object3D) {
  while (o.parent) {
    o = o.parent;
  }

  if ((o as Scene).isScene) {
    (o.userData as IMapperUserData).needsReRender = true;
  } else {
    console.warn('markSceneOfItemForReRender() object not in scene');
  }
}
