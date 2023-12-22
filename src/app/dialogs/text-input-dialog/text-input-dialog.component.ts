import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type IMatInputType =
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'month'
  | 'number'
  | 'password'
  | 'search'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week';

export type ITextInputDialogData = {
  readonly title: string;
  readonly inputType: IMatInputType;
  readonly fieldLabel: string;
  readonly cancelText: string;
  readonly submitText: string;
  readonly validators: ValidatorFn[];
}

@Component({
  selector: 'mapper-text-input-dialog',
  standalone: true,
  imports: [MatDialogModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './text-input-dialog.component.html',
  styleUrl: './text-input-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextInputDialogComponent {

  static open(
    dialog: MatDialog,
    data: ITextInputDialogData,
  ) {
    return dialog.open<TextInputDialogComponent, ITextInputDialogData, string>(
      TextInputDialogComponent,
      {
        data,
      },
    );
  }

  readonly #dialogRef = inject<MatDialogRef<TextInputDialogComponent, string>>(MatDialogRef);
  readonly #dialogData: ITextInputDialogData = inject(MAT_DIALOG_DATA);

  readonly title = this.#dialogData.title;
  readonly cancelText = this.#dialogData.cancelText;
  readonly submitText = this.#dialogData.submitText;
  readonly fieldLabel = this.#dialogData.fieldLabel;
  readonly inputType = this.#dialogData.inputType;

  readonly formControl = new FormControl('', {
    nonNullable: true,
    validators: this.#dialogData.validators,
  });

  submit(event: SubmitEvent) {
    event.preventDefault();

    if (!this.formControl.valid || !this.formControl.enabled) {
      return;
    }

    this.#dialogRef.close(this.formControl.value);
  }

  getError() {
    console.info('formControl', this.formControl);
    const errors = this.formControl.errors;
    if (!errors) {
      return '';
    }
    const keys = Object.keys(errors);
    const key = keys[0];

    return `Validation error: ${key}`;
  }
}
