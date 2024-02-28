import { Directive, inject, Input, Output } from '@angular/core';
import { KeyBindService, KeyBindString } from '../services/key-bind.service';
import { map, Subject, switchMap } from 'rxjs';

@Directive({
  selector: '[mapperKeyBind]',
  standalone: true,
})
export class KeyBindDirective {
  readonly #keyBindService = inject(KeyBindService);

  readonly #keyBindString$ = new Subject<KeyBindString>();

  /**
   * The keybinding that should trigger a click.
   */
  @Input({ required: true })
  set mapperKeyBind(v: KeyBindString) {
    this.#keyBindString$.next(v);
  }

  /**
   * Duplicate the builtin click handler so we can emulate a click
   * if the mapped keybinding is clicked.
   */
  @Output('click')
  readonly clickCallback = this.#keyBindString$.pipe(
    switchMap(kb => this.#keyBindService.registerStr$(kb)),
    map(() => undefined),
  );
}
