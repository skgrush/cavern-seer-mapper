import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, first, map, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { AggregateError2 } from '../../shared/errors/aggregate.error';
import { UploadFileModel } from '../../shared/models/upload-file-model';
import { ignoreNullish } from '../../shared/operators/ignore-nullish';
import { ErrorService } from '../../shared/services/error.service';
import { FileTypeService } from '../../shared/services/file-type.service';
import { ModelLoadService } from '../../shared/services/model-load.service';
import { ModelManagerService } from '../../shared/services/model-manager.service';


@Component({
  selector: 'mapper-file-url-loader',
  standalone: true,
  imports: [MatProgressSpinnerModule, NgIf, AsyncPipe],
  templateUrl: './file-url-loader.component.html',
  styleUrl: './file-url-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUrlLoaderComponent {

  readonly #errorService = inject(ErrorService);
  readonly #route = inject(ActivatedRoute);
  readonly #modelManager = inject(ModelManagerService);
  readonly #modelLoader = inject(ModelLoadService);
  readonly #fileType = inject(FileTypeService);

  readonly show$ = new BehaviorSubject(false);

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
      ignoreNullish(),
      first(),
      switchMap(({ author, fileId, isAsset }) => {

        const base = isAsset ? 'assets/' : '/';
        const url = `${base}files/${author}/${fileId}`;

        this.show$.next(true);

        return fromFetch(new Request(url, {
          mode: 'same-origin',
        })).pipe(
          switchMap(resp => resp.blob()),
          switchMap(blob => {
            const fileModel = new UploadFileModel(
              fileId,
              blob,
              blob.type,
              this.#fileType.getType(blob.type, ''),
              null
            );
            return this.#modelLoader.loadFile(fileModel);
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
      error: (err) => this.#errorService.alertError(err),
      complete: () => {
        this.show$.next(false);
      }
    });
  }
}
