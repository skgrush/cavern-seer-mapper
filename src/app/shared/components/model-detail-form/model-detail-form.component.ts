import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, startWith, switchMap, tap } from 'rxjs';
import { simpleVector3Equality } from '../../functions/vector-equality';
import { BaseRenderModel, BaseVisibleRenderModel } from '../../models/render/base.render-model';
import { ISimpleVector3 } from '../../models/simple-types';

const zeroVec = Object.freeze({
  x: 0,
  y: 0,
  z: 0,
});

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
        const { x, y, z } = model.position;
        this.formGroup.reset({
          position: {
            x,
            y,
            z,
          }
        }, {
          emitEvent: false,
        });
      }),
    ).subscribe();

    this.formGroup.controls.position.valueChanges.pipe(
      takeUntilDestroyed(this.#destroyRef),
      debounceTime(50),
      filter(() => this.formGroup.valid),
      distinctUntilChanged(simpleVector3Equality),
      tap((position) => {
        debugger;
        if (!(this.model instanceof BaseVisibleRenderModel)) {
          return;
        }
        const positionVector = { ...zeroVec, ...(position) as ISimpleVector3 };
        console.info('position changed', position);
        this.model.setPosition(positionVector);
      })
    ).subscribe();
  }
}
