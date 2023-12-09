import { Injectable } from '@angular/core';
import { UploadFileModel } from '../models/upload-file-model';
import { FileModelType } from '../models/model-type.enum';

@Injectable()
export class FileTypeService {

  readonly fileTypeIcons = Object.freeze({
    '': 'question',
    group: 'folder_zip',
    gltf: 'data_object',
    obj: 'deployed_code',
  } satisfies Record<FileModelType, string>);

  *mapFileList(files: FileList) {
    for (let i = 0; i < files.length; ++i) {
      yield this.mapFileModel(files[i]);
    }
  }

  mapFileModel(file: File): UploadFileModel {
    return UploadFileModel.fromFile(
      file,
      this.getType(file.type, file.name),
    );
  }

  getType(mime: string, name: string): FileModelType {
    if (this.isObj(mime, name)) {
      return FileModelType.obj;
    }
    if (this.isGltf(mime, name)) {
      return FileModelType.gLTF;
    }
    if (this.isSupportedGroupArchive(mime, name)) {
      return FileModelType.group;
    }
    return FileModelType.unknown;
  }

  /**
   * Gets the file extension with the dot, toLowerCase.
   */
  getFileExtension(name: string) {
    const lastIndexOfDot = name.lastIndexOf('.');
    if (lastIndexOfDot === -1) {
      return '';
    }
    return name.slice(lastIndexOfDot).toLowerCase();
  }

  isObj(mime: string, name: string) {
    return mime === 'model/obj' || this.getFileExtension(name) === '.obj';
  }

  isGltf(mime: string, name: string) {
    const ext = this.getFileExtension(name);
    return (
      mime === 'model/gltf+json' ||
      mime === 'model/gltf-binary' ||
      ext === '.gltf' ||
      ext === '.glb'
    );
  }

  isZip(mime: string, name: string) {
    return mime === 'application/zip' || this.getFileExtension(name) === '.zip';
  }

  isSupportedGroupArchive(mime: string, name: string) {
    return this.isZip(mime, name);
  }
}
