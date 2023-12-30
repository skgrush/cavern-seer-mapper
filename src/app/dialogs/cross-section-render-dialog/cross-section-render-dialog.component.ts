import { AsyncPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, defer, merge, switchMap, tap } from 'rxjs';
import { Camera } from 'three';
import { CrossSectionDetailsForm, CrossSectionDetailsFormComponent } from '../../shared/components/cross-section-details-form/cross-section-details-form.component';
import { CrossSectionAnnotation } from '../../shared/models/annotations/cross-section.annotation';
import { CanvasService } from '../../shared/services/canvas.service';
import { ErrorService } from '../../shared/services/error.service';
import { ToggleMaterialSidesToolService } from '../../shared/services/tools/toggle-material-sides-tool.service';

export type ICrossSectionRenderDialogData = {
  readonly crossSection: CrossSectionAnnotation;
  readonly formGroup: CrossSectionDetailsForm;
};

@Component({
  selector: 'mapper-cross-section-render-dialog',
  standalone: true,
  templateUrl: './cross-section-render-dialog.component.html',
  styleUrl: './cross-section-render-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CrossSectionDetailsFormComponent, MatDialogModule, MatButtonModule, MatIconModule, AsyncPipe, MatTooltipModule],
})
export class CrossSectionRenderDialogComponent implements AfterViewInit {

  @ViewChild('canvas')
  canvasElement!: ElementRef<HTMLCanvasElement>;

  readonly #destroyRef = inject(DestroyRef);
  readonly #canvasService = inject(CanvasService);
  readonly #dialog = inject(MatDialog);
  readonly #errorService = inject(ErrorService);

  readonly toggleMaterial = inject(ToggleMaterialSidesToolService);

  static open(
    dialog: MatDialog,
    data: ICrossSectionRenderDialogData,
  ) {
    return dialog.open<CrossSectionRenderDialogComponent, ICrossSectionRenderDialogData>(
      CrossSectionRenderDialogComponent,
      {
        data,
      },
    );
  }

  readonly #dialogRef = inject<MatDialogRef<CrossSectionRenderDialogComponent>>(MatDialogRef);
  readonly #dialogData: ICrossSectionRenderDialogData = inject(MAT_DIALOG_DATA);

  readonly crossSection = this.#dialogData.crossSection;
  readonly formGroup = this.#dialogData.formGroup;

  /** Trigger the export dialog. */
  readonly exportSubject = new Subject<void>();

  ngAfterViewInit() {
    this.#init();
  }

  #init() {
    const canvas = this.canvasElement.nativeElement;
    const crossSection = this.#dialogData.crossSection;

    const dimensions = crossSection.dimensions;

    const ratio = dimensions.x / dimensions.y;

    const [width, height] = this.#calculateDimensions(ratio);

    canvas.width = width;
    canvas.height = height;

    const sym = Symbol('cross-section-renderer');
    const { camera, crossSectionRenderMode$ } = crossSection.startRenderMode();

    const export$ = this.exportSubject.pipe(
      switchMap(() => this.#export(camera, sym)),
    );

    // all render logic
    const subRenderer$ = this.#canvasService.initializeSubRenderer$(
      sym,
      canvas,
      { width, height },
      camera
    ).pipe(
      switchMap(renderer => {
        return this.formGroup.controls.dimensions.valueChanges.pipe(
          tap(dimensions => {
            const newRatio = dimensions.width! / dimensions.height!;
            const [newWidth, newHeight] = this.#calculateDimensions(newRatio);
            renderer.setSize(newWidth, newHeight);
          }),
        );
      }),
    );

    merge(
      subRenderer$,
      export$,
      crossSectionRenderMode$,
    ).pipe(
      takeUntilDestroyed(this.#destroyRef),
    ).subscribe({
      error: e => this.#errorService.alertError(e),
    });
  }

  #calculateDimensions(ratio: number): [width: number, height: number] {

    const maxDimension = window.innerHeight - 330;

    return ratio < 1
      ? [maxDimension * ratio, maxDimension]
      : [maxDimension, maxDimension / ratio];
  }

  #export(camera: Camera, rendererSymbol: symbol) {
    return defer(() => import('../export-image-dialog/export-image-dialog.component')).pipe(
      switchMap(({ ExportImageDialogComponent }) => {
        return ExportImageDialogComponent.open(
          this.#dialog,
          {
            titleText: `Export cross-section ${this.crossSection.identifier}`,
            camera,
            rendererSymbol,
          },
        ).afterClosed();
      })
    )
  }
}
