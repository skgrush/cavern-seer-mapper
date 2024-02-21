import { Injectable } from '@angular/core';
import JSZip, { JSZipObject, loadAsync } from 'jszip';
import { Observable, defer, from, last, map, switchMap, tap } from 'rxjs';
import { UploadFileModel } from '../models/upload-file-model';
import { TransportProgressHandler } from '../models/transport-progress-handler';

export type IUnzipEntry = IUnzipDirEntry | IUnzipFileEntry;
export type IUnzipDirEntry = {
  readonly dir: true;
  readonly path: string;
  readonly name: string;
  readonly comment: string | null;
  readonly children: IUnzipEntry[];
  readonly blob?: undefined;
};
export type IUnzipFileEntry = {
  readonly dir: false;
  readonly path: string;
  readonly name: string;
  readonly comment: string | null;
  readonly children?: never;
  readonly blob: Blob;
}

export type IZipEntry = {
  readonly path: string;
  readonly comment: string | null;
  readonly data: Blob;
}

@Injectable({
  // necessary to be providedIn:root for dynamic injection
  providedIn: 'root',
})
export class ZipService {

  zip$({ generator, fileComment, compressionLevel, progress }: {
    generator: AsyncGenerator<IZipEntry>,
    fileComment: string | null,
    compressionLevel: number,
    progress?: TransportProgressHandler,
  }): Observable<Blob> {
    const zip = new JSZip();

    if (compressionLevel < 1 || compressionLevel > 9) {
      throw new Error(`Invalid compressionLevel ${compressionLevel}`);
    }

    return from(generator).pipe(
      tap(entry => console.info('adding zip entry', entry)),
      tap(({ path, data, comment }) => {
        progress?.addToTotal(data.size, true);
        return zip.file(path, data, {
          comment: comment ?? undefined,
        });
      }),
      last(),
      tap(() => console.info('zipped last entry, starting compression...')),
      switchMap(() => this.zipZipWithTransportProgress({
        zip,
        fileComment,
        compressionLevel,
        progress,
      })),
      tap(() => console.info('zipping complete')),
    );
  }

  zipZipWithTransportProgress({
    zip, fileComment, compressionLevel, progress,
  }: {
    zip: JSZip,
    fileComment: string | null,
    compressionLevel: number,
    progress?: TransportProgressHandler,
  }) {
    const streamHelper = zip.generateInternalStream({
      comment: fileComment ?? undefined,
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: compressionLevel },
    });

    return streamHelper.accumulate(
      ({ percent, currentFile }) => progress?.setLoadPercent(percent, currentFile ?? undefined)
    );
  }

  /**
   * Unzip and recurse the zip file, emitting once
   */
  unzip$(file: UploadFileModel) {
    return defer(() => loadAsync(file.blob)).pipe(
      switchMap(async (jszip) => {

        // comment field exists on top-level JSZip but the type is not defined?
        const comment = (jszip as any).comment ?? null;

        const children = await Promise.all([...this.recursivelyBuildHierarchy(jszip)]);
        const result: IUnzipDirEntry & { file: UploadFileModel } = {
          file,
          dir: true as const,
          path: '',
          name: file.identifier,
          comment,
          children,
        };
        return result;
      }),
    );
  }

  /**
   * First yield all files at this level,
   * then yield all directories at this level (each with their children).
   */
  *recursivelyBuildHierarchy(zip: JSZip): Generator<Promise<IUnzipEntry>> {
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
      yield fileEntry.async('blob').then(blob => ({
        dir: false,
        comment: fileEntry.comment,
        path: fileEntry.name,
        name,
        blob,
      }));
    }

    // yield directories from this dir
    for (const [name, dirEntry] of dirsAtThisLevel) {
      const folderJSZip = zip.folder(name);
      if (!folderJSZip) {
        throw new Error(`Dir entry just found was not found by .folder(): ${name}|${dirEntry.name}`);
      }
      yield Promise.all([...this.recursivelyBuildHierarchy(folderJSZip)]).then(children => ({
        dir: true,
        comment: dirEntry.comment,
        path: dirEntry.name,
        name,
        children,
      }));
    }
  }
}
