import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ResizeService } from '../../shared/services/resize.service';
import { CrossSectionAnnotation } from '../../shared/models/annotations/cross-section.annotation';
import { CanvasService } from '../../shared/services/canvas.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CrossSectionDetailsForm, CrossSectionDetailsFormComponent } from '../../shared/components/cross-section-details-form/cross-section-details-form.component';
import { map, switchMap, tap } from 'rxjs';

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
  imports: [CrossSectionDetailsFormComponent]
})
export class CrossSectionRenderDialogComponent implements AfterViewInit {

  @ViewChild('canvas')
  canvasElement!: ElementRef<HTMLCanvasElement>;

  readonly #destroyRef = inject(DestroyRef);
  readonly #resizeService = inject(ResizeService);
  readonly #canvasService = inject(CanvasService);


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

  ngAfterViewInit() {
    this.#init();
  }

  #init() {
    const canvas = this.canvasElement.nativeElement;
    const crossSection = this.#dialogData.crossSection;
    crossSection.toggleVisibility(false);

    const dimensions = crossSection.dimensions;

    const ratio = dimensions.x / dimensions.y;

    const [width, height] = this.calculateDimensions(ratio);

    canvas.width = width;
    canvas.height = height;

    const camera = crossSection.addCamera();

    this.#canvasService.initializeSubRenderer$(
      canvas,
      { width, height },
      camera
    ).pipe(
      takeUntilDestroyed(this.#destroyRef),
      switchMap(renderer => {
        return this.formGroup.controls.dimensions.valueChanges.pipe(
          tap(dimensions => {
            const newRatio = dimensions.width! / dimensions.height!;
            const [newWidth, newHeight] = this.calculateDimensions(newRatio);
            renderer.setSize(newWidth, newHeight);
          }),
        )
      }),
    ).subscribe({
      complete: () => {
        crossSection.toggleVisibility(true);
        crossSection.removeCamera();
      }
    })
  }

  calculateDimensions(ratio: number): [width: number, height: number] {

    const maxDimension = window.innerHeight - 330;


    return ratio < 1
      ? [maxDimension * ratio, maxDimension]
      : [maxDimension, maxDimension / ratio];
  }
}
