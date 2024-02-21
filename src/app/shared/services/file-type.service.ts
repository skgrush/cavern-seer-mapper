import { Injectable } from '@angular/core';
import { UploadFileModel } from '../models/upload-file-model';
import { FileModelType } from '../models/model-type.enum';

@Injectable()
export class FileTypeService {

  readonly manifestFileName = '__cavern-seer-manifest.json';

  readonly extensions = {
    [FileModelType.obj]: '.obj',
    [FileModelType.gLTF]: ['.gltf', '.glb'],
    [FileModelType.group]: '.zip',
    [FileModelType.walls]: '.wrl',
    [FileModelType.cavernseerscan]: '.cavernseerscan',
    [FileModelType.mtl]: '.mtl',
  } as const;

  readonly mimes = {
    [FileModelType.obj]: 'model/obj',
    [FileModelType.gLTF]: ['model/gltf+json', 'model/gltf-binary'],
    [FileModelType.group]: 'application/zip',
    [FileModelType.walls]: 'model/vrml',
    [FileModelType.cavernseerscan]: 'application/vnd.org.grush.cavernseer.scan',
    [FileModelType.mtl]: 'model/mtl',
  } as const;

  getAllExtensionsAndMimes() {
    return [
      ...Object.values(this.extensions),
      ...Object.values(this.mimes),
    ].flat();
  }

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
    if (this.isCavernSeerScan(mime, name)) {
      return FileModelType.cavernseerscan;
    }
    if (this.isVrmlFile(mime, name)) {
      return FileModelType.walls;
    }
    if (this.isMtlFile(mime, name)) {
      return FileModelType.mtl;
    }

    return FileModelType.unknown;
  }

  isVisibleRenderModelType(type: FileModelType) {
    switch (type) {
      case FileModelType.obj:
      case FileModelType.gLTF:
      case FileModelType.walls:
      case FileModelType.group:
      case FileModelType.cavernseerscan:
        return true;
      case FileModelType.unknown:
      case FileModelType.mtl:
        return false;
      default:
        throw new Error(`Unknown FileModelType: ${type satisfies never}`);
    }
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
    return mime === this.mimes.obj || this.getFileExtension(name) === this.extensions.obj;
  }

  isGltf(mime: string, name: string) {
    const ext = this.getFileExtension(name);
    return (
      this.mimes.gltf.includes(mime as any) ||
      this.extensions.gltf.includes(ext as any)
    );
  }

  isZip(mime: string, name: string) {
    return mime === this.mimes.group || this.getFileExtension(name) === this.extensions.group;
  }

  isSupportedGroupArchive(mime: string, name: string) {
    return this.isZip(mime, name);
  }

  isCavernSeerScan(mime: string, name: string) {
    return mime === this.mimes.cavernseerscan || this.getFileExtension(name) === this.extensions.cavernseerscan;
  }

  isVrmlFile(mime: string, name: string) {
    return mime === this.mimes.walls || this.getFileExtension(name) === this.extensions.walls;
  }

  isMtlFile(mime: string, name: string) {
    return mime === this.mimes.mtl || this.getFileExtension(name) === this.extensions.mtl;
  }
}
