import { Directive, inject, Injectable, Input, Output } from '@angular/core';
import { KeyBindService, KeyBindString } from '../services/key-bind.service';
import { map, ReplaySubject, switchMap } from 'rxjs';

@Injectable()
export class KeyBindContext {
  readonly #keyBindString$ = new ReplaySubject<KeyBindString>(1);
  public keyBindString$ = this.#keyBindString$.asObservable();

  public changeKeyBind(keybind: KeyBindString) {
    this.#keyBindString$.next(keybind);
  }
}

@Directive({
  selector: '[mapperKeyBind]',
  standalone: true,
  providers: [KeyBindContext],
})
export class KeyBindDirective {
  readonly #keyBindService = inject(KeyBindService);

  readonly #keyBindContext = inject(KeyBindContext);

  /**
   * The keybinding that should trigger a click.
   */
  @Input({ required: true })
  set mapperKeyBind(v: KeyBindString) {
    this.#keyBindContext.changeKeyBind(v);
  }

  /**
   * Duplicate the builtin click handler so we can emulate a click
   * if the mapped keybinding is clicked.
   */
  @Output('click')
  readonly clickCallback = this.#keyBindContext.keyBindString$.pipe(
    switchMap(kb => this.#keyBindService.registerStr$(kb)),
    map(() => undefined),
  );
}
