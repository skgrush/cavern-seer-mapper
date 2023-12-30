import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject, debounceTime, filter } from 'rxjs';
import { Vector3 } from 'three';
import { CrossSectionDetailsForm, CrossSectionDetailsFormComponent } from "../../../shared/components/cross-section-details-form/cross-section-details-form.component";
import { CrossSectionAnnotation } from '../../../shared/models/annotations/cross-section.annotation';
import { ignoreNullish } from '../../../shared/operators/ignore-nullish';
import { VectorPipe } from '../../../shared/pipes/vector.pipe';
import { CrossSectionToolService } from '../../../shared/services/tools/cross-section-tool.service';

@Component({
  selector: 'mapper-cross-section-tab',
  standalone: true,
  templateUrl: './cross-section-tab.component.html',
  styleUrl: './cross-section-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, CommonModule, MatIconModule, MatButtonModule, MatButtonToggleModule, MatMenuModule, MatSelectModule, FormsModule, ReactiveFormsModule, VectorPipe, AsyncPipe, CrossSectionDetailsFormComponent]
})
export class CrossSectionTabComponent {
  readonly #dialog = inject(MatDialog);
  readonly crossSectionTool = inject(CrossSectionToolService);

  readonly dialogOpen$ = new BehaviorSubject(false);

  readonly formGroup = new FormGroup({
    selected: new FormControl<CrossSectionAnnotation[]>([], { nonNullable: true }),
    details: new FormGroup({
      position: new FormGroup({
        x: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
        y: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
        z: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
      }),
      dimensions: new FormGroup({
        width: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
        height: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
        depth: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      }),
      rotationDegrees: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    }) satisfies CrossSectionDetailsForm,
  });

  constructor() {
    this.crossSectionTool.selected$.pipe(
      takeUntilDestroyed(),
    ).subscribe(selected => {
      const pos = selected?.anchorPoint;
      const dims = selected?.dimensions;
      this.formGroup.reset({
        selected: selected ? [selected] : [],
        details: {
          position: {
            x: pos?.x ?? 0,
            y: pos?.y ?? 0,
            z: pos?.z ?? 0,
          },
          dimensions: {
            width: dims?.x ?? 0,
            height: dims?.y ?? 0,
            depth: dims?.z ?? 0,
          },
          rotationDegrees: selected?.angleToNorthAroundY ?? 0,
        }
      }, {
        emitEvent: false,
      });
    });

    this.formGroup.controls.selected.valueChanges.pipe(
      takeUntilDestroyed(),
    ).subscribe(selected => {
      this.crossSectionTool.selectCrossSection(selected[0] ?? null);
    });
    this.formGroup.controls.details.controls.position.valueChanges.pipe(
      takeUntilDestroyed(),
      ignoreNullish(),
      filter(() => this.formGroup.controls.details.controls.position.valid),
    ).subscribe(pos => {
      const selected = this.formGroup.value.selected?.[0];
      if (!selected || !this.formGroup.valid) {
        return;
      }
      const posVec = new Vector3(pos.x, pos.y, pos.z);
      this.crossSectionTool.changeCrossSectionPosition(selected, posVec);
    });

    this.formGroup.controls.details.controls.dimensions.valueChanges.pipe(
      takeUntilDestroyed(),
      ignoreNullish(),
      filter(() => this.formGroup.controls.details.controls.dimensions.valid),
    ).subscribe(dims => {
      const selected = this.formGroup.value.selected?.[0];
      if (!selected) {
        return;
      }

      const dimsVec = new Vector3(dims.width, dims.height, dims.depth);
      this.crossSectionTool.changeCrossSectionDimensions(selected, dimsVec);
    });
    this.formGroup.controls.details.controls.rotationDegrees.valueChanges.pipe(
      takeUntilDestroyed(),
      debounceTime(0),
      ignoreNullish(),
      filter(() => this.formGroup.valid),
    ).subscribe(angleDegrees => {
      const selected = this.formGroup.value.selected?.[0];
      if (!selected) {
        return;
      }

      this.crossSectionTool.changeCrossSectionRotation(selected, angleDegrees);
    });
  }

  deleteCrossSection() {
    const selected = this.formGroup.value.selected;
    if (!selected?.length) {
      return;
    }

    this.crossSectionTool.deleteCrossSection(selected);
  }

  async rename() {
    const selected = this.formGroup.value.selected?.[0];

    if (!selected) {
      return;
    }

    const oldName = selected.identifier;
    const renameValidator: ValidatorFn = (control: AbstractControl<string>) => {
      const newName = control.value;
      if (!newName) {
        return null;
      }
      if (!this.crossSectionTool.crossSectionRenameIsValid(oldName, newName)) {
        return { [`Identifier ${JSON.stringify(newName)} is already in use`]: true };
      }
      return null;
    };

    const { TextInputDialogComponent } = await import('../../../dialogs/text-input-dialog/text-input-dialog.component')
    TextInputDialogComponent.open(
      this.#dialog,
      {
        title: 'Rename a cross-section',
        submitText: 'Rename',
        cancelText: 'Cancel',
        fieldLabel: `Rename ${oldName}`,
        inputType: 'text',
        validators: [Validators.required, renameValidator],
      }
    ).afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      this.crossSectionTool.renameCrossSection(selected, result);
    });
  }

  async render() {
    const selected = this.formGroup.controls.selected.value?.[0];
    if (!selected) {
      return;
    }

    this.dialogOpen$.next(true);

    const { CrossSectionRenderDialogComponent } = await import('../../../dialogs/cross-section-render-dialog/cross-section-render-dialog.component');

    CrossSectionRenderDialogComponent.open(
      this.#dialog,
      {
        crossSection: selected,
        formGroup: this.formGroup.controls.details,
      },
    ).afterClosed().subscribe(() => {
      this.dialogOpen$.next(false);
    });
  }
}
