import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CrossSectionAnnotation } from '../../models/annotations/cross-section.annotation';
import { MatInputModule } from '@angular/material/input';


export type CrossSectionDetailsForm = FormGroup<{
  position: FormGroup<{
    x: FormControl<number>,
    y: FormControl<number>,
    z: FormControl<number>,
  }>,
  dimensions: FormGroup<{
    width: FormControl<number>,
    height: FormControl<number>,
    depth: FormControl<number>,
  }>,
  rotationDegrees: FormControl<number>,
}>;

@Component({
  selector: 'mapper-cross-section-details-form',
  standalone: true,
  templateUrl: './cross-section-details-form.component.html',
  styleUrl: './cross-section-details-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
})
export class CrossSectionDetailsFormComponent {

  @Input({ required: true })
  crossSection!: CrossSectionAnnotation;

  @Input({ required: true })
  formGroup!: CrossSectionDetailsForm;

  @Output()
  readonly formSubmitted = new EventEmitter<void>();
}
