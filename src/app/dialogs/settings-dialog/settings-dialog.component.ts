import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { tap } from 'rxjs';
import { MeasurementSystem } from '../../shared/services/settings/measurement-system';
import { SettingsService } from '../../shared/services/settings/settings.service';
import { ByteFormatType } from '../../shared/formatters/format-bytes';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BytesPipe } from "../../shared/pipes/bytes.pipe";

@Component({
  selector: 'mapper-settings-dialog',
  standalone: true,
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, AsyncPipe, MatButtonModule, FormsModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule, MatButtonToggleModule, BytesPipe]
})
export class SettingsDialogComponent implements OnInit {
  protected readonly MeasurementSystem = MeasurementSystem;
  protected readonly ByteFormatType = ByteFormatType;

  readonly #destroyRef = inject(DestroyRef);
  readonly #settings = inject(SettingsService);

  readonly formGroup = new FormGroup({
    measurementSystem: new FormControl(undefined as MeasurementSystem | undefined, { validators: [Validators.required], nonNullable: true }),
    byteFormat: new FormControl(undefined as ByteFormatType | undefined, { validators: [Validators.required], nonNullable: true }),
  });

  static open(dialog: MatDialog) {
    return dialog.open(SettingsDialogComponent);
  }

  ngOnInit(): void {
    this.#settings.state$.pipe(
      takeUntilDestroyed(this.#destroyRef),
      tap(state => this.formGroup.reset(state)),
    ).subscribe();
  }

  save() {
    this.#settings.updateSettings(this.formGroup.value);
  }
}
