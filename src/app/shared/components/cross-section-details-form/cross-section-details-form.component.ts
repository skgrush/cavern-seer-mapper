import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CrossSectionAnnotation, degreesPerRadian } from '../../models/annotations/cross-section.annotation';
import { ISimpleVector3 } from '../../models/simple-types';


export type CrossSectionDetailsForm = FormGroup<{
  position: FormGroup<{
    x: FormControl<number>,
    y: FormControl<number>,
    z: FormControl<number>,
  }>,
  dimensions: FormGroup<{
    x: FormControl<number>,
    y: FormControl<number>,
    z: FormControl<number>,
  }>,
  rotationDegrees: FormControl<number>,
}>;

@Component({
  selector: 'mapper-cross-section-details-form',
  standalone: true,
  templateUrl: './cross-section-details-form.component.html',
  styleUrl: './cross-section-details-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule],
})
export class CrossSectionDetailsFormComponent {

  @Input({ required: true })
  crossSection!: CrossSectionAnnotation;

  @Input({ required: true })
  formGroup!: CrossSectionDetailsForm;

  @Output()
  readonly formSubmitted = new EventEmitter<void>();

  forward(meters: number) {
    const { position, rotationDegrees } = this.formGroup.getRawValue();

    const deltaX = Math.sin(rotationDegrees / degreesPerRadian) * meters;
    const deltaZ = -Math.cos(rotationDegrees / degreesPerRadian) * meters;

    const newVec: ISimpleVector3 = {
      x: position.x + deltaX,
      y: position.y,
      z: position.z + deltaZ,
    };

    this.formGroup.controls.position.setValue(newVec);
  }
}
