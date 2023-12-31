import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { first, map, switchMap, throwError } from 'rxjs';
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


@Component({
  selector: 'mapper-file-url-loader',
  standalone: true,
  templateUrl: './file-url-loader.component.html',
  styleUrl: './file-url-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, AsyncPipe, BytesPipe]
})
export class FileUrlLoaderComponent {

  readonly #errorService = inject(ErrorService);
  readonly #route = inject(ActivatedRoute);
  readonly #modelManager = inject(ModelManagerService);
  readonly #modelLoader = inject(ModelLoadService);
  readonly #fileType = inject(FileTypeService);

  readonly progress = new TransportProgressHandler();

  ngOnInit(): void {
    this.#route.queryParamMap.pipe(
      map(qp => {
        const author = qp.get('author');
        const fileId = qp.get('fileId');
        const isAsset = qp.get('asset') !== null;

        if (!author || !fileId) {
          return null;
        }
        return { author, fileId, isAsset };
      }),
      // on initial load of the page, query params are sometimes missing.
      // we want to get the first non-nullish params
      ignoreNullish(),
      first(),
      switchMap(({ author, fileId, isAsset }) => {

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
          switchMap(blob => {

            this.progress.changeTotal(blob.size);

            const fileModel = new UploadFileModel(
              fileId,
              blob,
              blob.type,
              this.#fileType.getType(blob.type, ''),
              null
            );
            return this.#modelLoader.loadFile(fileModel, this.progress);
          }),
          map(loadResult => {
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
        );
      }),
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
}
