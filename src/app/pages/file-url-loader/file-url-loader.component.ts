import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { first, map, Observable, of, switchMap, throwError } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { AggregateError2 } from '../../shared/errors/aggregate.error';
import { TransportProgressHandler } from '../../shared/models/transport-progress-handler';
import { UploadFileModel } from '../../shared/models/upload-file-model';
import { ignoreNullish } from '../../shared/operators/ignore-nullish';
import { BytesPipe } from "../../shared/pipes/bytes.pipe";
import { ErrorService } from '../../shared/services/error.service';
import { FileTypeService } from '../../shared/services/file-type.service';
import { ModelLoadService } from '../../shared/services/model-load.service';
import { ModelManagerService } from '../../shared/services/model-manager.service';
import { LaunchQueueService } from '../../shared/services/launch-queue.service';



type OpenerResult = {
  readonly fileId: string;
  readonly blob: Blob;
}

@Component({
  selector: 'mapper-file-url-loader',
  standalone: true,
  templateUrl: './file-url-loader.component.html',
  styleUrl: './file-url-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, AsyncPipe, BytesPipe]
})
export class FileUrlLoaderComponent implements OnInit {

  readonly #errorService = inject(ErrorService);
  readonly #route = inject(ActivatedRoute);
  readonly #modelManager = inject(ModelManagerService);
  readonly #modelLoader = inject(ModelLoadService);
  readonly #fileType = inject(FileTypeService);
  readonly #launchQueue = inject(LaunchQueueService);

  readonly progress = new TransportProgressHandler();

  ngOnInit(): void {
    this.#route.queryParamMap.pipe(
      switchMap(qp => {
        const author = qp.get('author');
        const fileId = qp.get('fileId');
        const isAsset = qp.get('asset') !== null;
        const isFileHandler = qp.get('fileHandler') !== null;

        if (isFileHandler) {
          return this.#handleFileHandler();
        }
        if (author && fileId) {
          return this.#handleFileUrl({author, fileId, isAsset});
        }
        return of(null);
      }),
      // on initial load of the page, query params are sometimes missing.
      // we want to get the first non-nullish params
      ignoreNullish(),
      first(),
      switchMap(({ blob, fileId }: OpenerResult) => {

        this.progress.changeTotal(blob.size);

        const fileModel = new UploadFileModel(
          fileId,
          blob,
          blob.type,
          this.#fileType.getType(blob.type, fileId),
          null
        );
        return this.#modelLoader.loadFile(fileModel, this.progress).pipe(map(loadResult => ({ loadResult, fileId })));
      }),
      map(({ loadResult, fileId }) => {
        if (loadResult.errors.length) {
          const err = new AggregateError2(`Failure loading fileId=${fileId}`, loadResult.errors);
          if (!loadResult.result) {
            throw err;
          } else {
            this.#errorService.alertError(err);
          }
        }
        return loadResult.result!;
      }),
      first(),
    ).subscribe({
      next: model => this.#modelManager.importModels([model]),
      error: (err) => {
        this.progress.deactivate();
        this.#errorService.alertError(err);
      },
      complete: () => {
        this.progress.deactivate();
      }
    });
  }

  #handleFileUrl({ author, fileId, isAsset }: { author: string, fileId: string, isAsset: boolean }): Observable<OpenerResult> {
      const base = isAsset ? 'assets/' : '/';
      const url = `${base}files/${author}/${fileId}`;

      this.progress.reset(true);

      return fromFetch(new Request(url, {
        mode: 'same-origin',
        cache: 'default',
      })).pipe(
        switchMap(resp => {
          if (resp.ok) {
            return resp.blob();
          } else {
            return throwError(() => new Error(`${resp.status} ${resp.statusText}: ${fileId}`));
          }
        }),
        map(blob => ({ blob, fileId }))
      );
    }

    #handleFileHandler(): Observable<OpenerResult | null> {

      return this.#launchQueue.launchQueueConsumer$.pipe(
        switchMap(async launchParams => {
          if (!launchParams) {
            return null;
          }
          this.progress.reset(true);

          const firstEntry = launchParams.files[0];
          if (!firstEntry) {
            throw new Error('no file found in fileHandler');
          }
          if (firstEntry.kind === 'directory') {
            throw new Error('opening directories not yet supported by fileHandler');
          }

          const file = await (firstEntry as FileSystemFileHandle).getFile();

          return { blob: file, fileId: firstEntry.name };
        })
      )
    }
}
