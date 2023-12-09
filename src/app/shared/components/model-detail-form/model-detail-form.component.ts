import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { BaseRenderModel } from '../../models/render/base.render-model';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime, startWith, switchMap, tap } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ISimpleVector3 } from '../../models/simple-types';

const zeroVec = Object.freeze({
  x: 0,
  y: 0,
  z: 0,
});

@Component({
  selector: 'mapper-model-detail-form',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
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
      x: new FormControl(0, { nonNullable: true }),
      y: new FormControl(0, { nonNullable: true }),
      z: new FormControl(0, { nonNullable: true }),
    }),
  }, {
    updateOn: 'blur'
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

    this.formGroup.valueChanges.pipe(
      takeUntilDestroyed(this.#destroyRef),
      debounceTime(50),
      tap(({ position }) => {
        const positionVector = { ...zeroVec, ...(position) as ISimpleVector3 };
        console.info('position changed', position);
        this.model.setPosition(positionVector);
      })
    ).subscribe();
  }
}
