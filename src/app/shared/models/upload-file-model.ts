import { IUnzipFileEntry } from "../services/zip.service";
import { FileModelType } from "./model-type.enum";

const sym = Symbol('UploadFileModel');

export class UploadFileModel {

  readonly [sym] = true;

  constructor(
    readonly identifier: string,
    readonly blob: Blob,
    readonly mime: string,
    readonly type: FileModelType,
    readonly comment: string | null,
  ) { }

  static fromFile(file: File, type: FileModelType): UploadFileModel {
    return new UploadFileModel(
      file.name,
      file,
      file.type,
      type,
      null,
    );
  }

  static fromUnzip(unzipEntry: IUnzipFileEntry, type: FileModelType) {
    return new UploadFileModel(
      unzipEntry.name,
      unzipEntry.blob,
      unzipEntry.blob.type,
      type,
      unzipEntry.comment,
    );
  }
}
