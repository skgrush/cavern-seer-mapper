import { Injectable, inject } from '@angular/core';
import { Observable, defer, map } from 'rxjs';
import JSZip, { loadAsync, JSZipObject } from 'jszip';
import { UploadFileModel } from '../models/upload-file-model';
import { FileTypeService } from './file-type.service';

export type IUnzipEntry = IUnzipDirEntry | IUnzipFileEntry;
export type IUnzipDirEntry = {
  readonly dir: true;
  readonly path: string;
  readonly name: string;
  readonly comment: string | null;
  readonly children: IUnzipEntry[];
  readonly loader?: undefined;
};
export type IUnzipFileEntry = {
  readonly dir: false;
  readonly path: string;
  readonly name: string;
  readonly comment: string | null;
  readonly children?: never;
  readonly loader: () => Promise<Blob>;
}

@Injectable({
  // necessary to be providedIn:root for dynamic injection
  providedIn: 'root',
})
export class ZipService {

  readonly #fileTypeService = inject(FileTypeService);

  /**
   * Unzip and recurse the zip file, emitting once
   */
  unzip$(file: UploadFileModel) {
    return defer(() => loadAsync(file.blob)).pipe(
      map(jszip => {

        const children = [...this.recursivelyBuildHierarchy(jszip)];
        const result = {
          file,
          dir: true as const,
          path: '',
          name: file.identifier,
          comment: '',
          children,
        };
        return result satisfies IUnzipDirEntry;
      }),
    );
  }

  /**
   * First yield all files at this level,
   * then yield all directories at this level (each with their children).
   */
  *recursivelyBuildHierarchy(zip: JSZip): Generator<IUnzipEntry> {
    const filesAtThisLevel = new Map<string, JSZipObject>();
    const dirsAtThisLevel = new Map<string, JSZipObject>();

    // go through all the entries
    zip.forEach((relPath, entry) => {
      const firstSlashPosition = relPath.indexOf('/');
      if (firstSlashPosition !== -1 && firstSlashPosition !== relPath.length - 1) {
        // this entry is in a subdir
        return;
      }

      if (entry.dir) {
        dirsAtThisLevel.set(relPath, entry);
      } else {
        // this is a file and not in a subdir
        filesAtThisLevel.set(relPath, entry);
      }
    });

    // yield files (from this dir) first
    for (const [name, fileEntry] of filesAtThisLevel) {
      yield {
        dir: false,
        comment: fileEntry.comment,
        path: fileEntry.name,
        name,
        loader: () => fileEntry.async('blob'),
      }
    }

    // yield directories from this dir
    for (const [name, dirEntry] of dirsAtThisLevel) {
      const folderJSZip = zip.folder(name);
      if (!folderJSZip) {
        throw new Error(`Dir entry just found was not found by .folder(): ${name}|${dirEntry.name}`);
      }
      yield {
        dir: true,
        comment: dirEntry.comment,
        path: dirEntry.name,
        name,
        children: [...this.recursivelyBuildHierarchy(folderJSZip)],
      };
    }
  }
}
