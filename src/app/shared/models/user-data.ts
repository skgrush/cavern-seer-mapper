
/**
 * type to help strengthen checks on ThreeJS's {@link Object3D#userData}.
 */
export type IMapperUserData = {
  /** indicates a group or mesh is from a serialized model */
  fromSerializedModel?: true,
  /** indicates a group is part of an annotation */
  isAnnotationGroup?: true,
}
