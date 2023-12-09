import { FileModelType } from "./model-type.enum";

export class UploadFileModel {
  constructor(
    readonly identifier: string,
    readonly blob: Blob,
    readonly mime: string,
    readonly type: FileModelType,
  ) { }

  static fromFile(file: File, type: FileModelType): UploadFileModel {
    return new UploadFileModel(
      file.name,
      file,
      file.type,
      type,
    );
  }
}
