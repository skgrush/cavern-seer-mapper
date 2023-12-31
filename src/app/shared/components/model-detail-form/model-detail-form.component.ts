import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, startWith, switchMap, tap } from 'rxjs';
import { zeroVector3 } from '../../constants/zero-vectors';
import { simpleVector3Equality } from '../../functions/vector-equality';
import { BaseRenderModel, BaseVisibleRenderModel } from '../../models/render/base.render-model';
import { ISimpleVector3 } from '../../models/simple-types';
import { LocalizeService } from '../../services/localize.service';


@Component({
  selector: 'mapper-model-detail-form',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, NgIf],
  templateUrl: './model-detail-form.component.html',
  styleUrl: './model-detail-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelDetailFormComponent implements OnInit {
  readonly #destroyRef = inject(DestroyRef);
  readonly #localize = inject(LocalizeService);

  readonly #model = new BehaviorSubject<BaseRenderModel<any>>(undefined!);

  @Input({ required: true })
  get model() {
    return this.#model.value;
  }
  set model(m) {
    this.#model.next(m);
  }

  readonly formGroup = new FormGroup({
    position: new FormGroup({
      x: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
      y: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
      z: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    }),
  });

  ngOnInit(): void {
    this.#model.pipe(
      takeUntilDestroyed(this.#destroyRef),
      switchMap(model => model.childOrPropertyChanged$.pipe(startWith(undefined))),
      startWith(undefined),
      tap(() => {
        const model = this.model;
        this.formGroup.reset({
          position: this.#localize.vectorMetersToLocalLength(model.position),
        }, {
          emitEvent: false,
        });
      }),
    ).subscribe();

    this.formGroup.controls.position.valueChanges.pipe(
      takeUntilDestroyed(this.#destroyRef),
      debounceTime(50),
      filter(() => this.formGroup.controls.position.valid),
      distinctUntilChanged(simpleVector3Equality),
      tap((position) => {
        if (!(this.model instanceof BaseVisibleRenderModel)) {
          return;
        }
        const positionVector = { ...zeroVector3, ...(position) as ISimpleVector3 };
        this.model.setPosition(this.#localize.vectorLocalLengthToMeters(positionVector));
      })
    ).subscribe();
  }
}
