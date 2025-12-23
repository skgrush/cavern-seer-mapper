import { AsyncPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Injector, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { tap } from 'rxjs';
import { BytesPipe } from "../../shared/pipes/bytes.pipe";
import { ByteFormatType } from '../../shared/services/localize.service';
import { MeasurementSystem } from '../../shared/services/settings/measurement-system';
import { SettingsService } from '../../shared/services/settings/settings.service';

@Component({
  selector: 'mapper-settings-dialog',
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
  readonly #document = inject(DOCUMENT);

  readonly formGroup = new FormGroup({
    measurementSystem: new FormControl(undefined as MeasurementSystem | undefined, { validators: [Validators.required], nonNullable: true }),
    byteFormat: new FormControl(undefined as ByteFormatType | undefined, { validators: [Validators.required], nonNullable: true }),
    gridScale: new FormControl(undefined as number | undefined, { validators: [Validators.required], nonNullable: true }),
  });

  static open(dialog: MatDialog, injector: Injector) {
    return dialog.open(SettingsDialogComponent, { injector });
  }

  ngOnInit(): void {
    this.#settings.state$.pipe(
      takeUntilDestroyed(this.#destroyRef),
      tap(state => this.formGroup.reset(state)),
    ).subscribe();
  }

  save() {
    this.#settings.updateSettings(this.formGroup.value);
    this.#document.location.reload();
  }
}
