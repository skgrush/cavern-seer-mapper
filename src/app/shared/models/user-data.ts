
/**
 * type to help strengthen checks on ThreeJS's {@link Object3D#userData}.
 */
export type IMapperUserData = {
  /** indicates a group or mesh is from a serialized model */
  fromSerializedModel?: true,
  /** indicates a group is part of an annotation */
  isAnnotationGroup?: true,
  /** This is an annotation mesh and is temporary */
  isTemporaryAnnotation?: true,
  /** should only be used on Scenes to mark that they need to rerender */
  needsReRender?: true,
  DEBUG_needsReRenderReason?: string | null;
}
