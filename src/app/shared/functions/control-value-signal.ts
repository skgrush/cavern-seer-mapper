import { AbstractControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';


export function controlValueSignal<TValue>(control: AbstractControl<TValue>) {
  return toSignal(
    control.valueChanges.pipe(
      startWith(control.value),
    ),
    {
      requireSync: true,
    },
  );
}
