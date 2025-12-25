import type { Object3D, Scene } from "three";
import { IMapperUserData } from "../models/user-data";
import { traverseSome } from './traverse-some';

/**
 * Iterate up the parent chain to the top;
 * if the top is a {@see Scene}, mark it as `needsReRender`.
 */
export function markSceneOfItemForReRender(obj: Object3D, DEBUG_reason: string | null | false) {
  let o = obj;
  while (o.parent) {
    o = o.parent;
  }

  if ((o as Scene).isScene) {
    const u = (o.userData as IMapperUserData);
    u.needsReRender = true;
    if (ngDevMode) {
      u.DEBUG_needsReRenderReason =
        (u.DEBUG_needsReRenderReason ? u.DEBUG_needsReRenderReason + '\0' : '')
        + DEBUG_reason;
    }
  } else {
    console.warn('markSceneOfItemForReRender() object not in scene');
  }
}

export const sceneNeedsReRenderOrHasChildNeedingUpdate =
  !ngDevMode
    ? (s: Scene) => (
      (s.userData as IMapperUserData).needsReRender ||
      traverseSome(s, o => o.matrixWorldNeedsUpdate)
    )
    : (s: Scene) => {
      const u = (s.userData as IMapperUserData);
      if (u.needsReRender) {
        console.debug(
          'sceneNeedsReRender',
          u.DEBUG_needsReRenderReason?.split('\0')
        );
        return true;
      }
      return traverseSome(s, o => {
        if (!o.matrixWorldNeedsUpdate) {
          return false;
        }
        console.debug('matrixWorldNeedsUpdate from', o);
        return true;
      });
    };
