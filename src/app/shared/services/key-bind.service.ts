import { inject, Injectable } from '@angular/core';
import { filter, fromEvent, map, Observable } from 'rxjs';
import { ErrorService } from './error.service';

type UpperCaseCharacter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
type AlphaCharacter = UpperCaseCharacter | Lowercase<UpperCaseCharacter>;
type NumericCharacter = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type SpecialCharacter = ' ' | '`' | '~' | '!' | '@' | '#' | '$' | '%' | '^' | '&' | '*' | '(' | ')' | '-' | '_' | '+' | '=' | '[' | '{' | '}' | ']' | '\\' | '|' | ';' | ':' | '"' | '\'' | ',' | '<' | '>' | '.' | '?' | '/';

type KeyCharacter = AlphaCharacter | NumericCharacter | SpecialCharacter;

type IKeyBind<TKey extends KeyCharacter = KeyCharacter> = {
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly shiftKey?: boolean;
  readonly metaKey?: boolean;
  readonly key: TKey;
}

const modifiers = ['ctrlKey', 'altKey', 'shiftKey', 'metaKey'] as const satisfies readonly (keyof IKeyBind)[];

type KeyBindString = `${'ctrl+'|''}${'alt+'|''}${'shift+'|''}${'meta+'|''}${KeyCharacter}`;

type UnSuffixKey<T extends `${string}Key`> = T extends `${infer K}Key` ? K : never;

@Injectable()
export class KeyBindService {
  readonly #errorService = inject(ErrorService);

  readonly #registry = new Map<KeyBindString, (e: KeyboardEvent) => void>();

  /**
   * Bind the element for universal keybindings.
   *
   * While subscribed, registered keybindings against this element call their registered callbacks,
   * **and `preventDefault()` on it**.
   */
  bindToKeyDownEvents$(ele: HTMLElement) {
    return fromEvent<KeyboardEvent>(ele, 'keydown').pipe(
      filter(e => this.keyEventCalled(e)),
      map(e => e.preventDefault()),
    );
  }

  /**
   * Pass in a keyboard event.
   *
   * @returns true if-and-only-if the event matched a registered event and called the callback.
   */
  keyEventCalled(e: KeyboardEvent) {
    if (e.key.length > 1) {
      return false;
    }

    const bindStr = this.makeBindStr(e as IKeyBind);

    const callback = this.#registry.get(bindStr);
    try {
      callback?.(e);
    } catch (e) {
      this.#errorService.handleError(e);
    }

    return !!callback;
  }

  register$(key: IKeyBind) {
    const keyStr = this.makeBindStr(key);
    return this.registerStr$(keyStr);
  }

  registerStr$(keyStr: KeyBindString) {
    return new Observable<KeyboardEvent>(subscriber => {
      if (this.#registry.has(keyStr)) {
        subscriber.error(`Key ${keyStr} is already registered`);
        return;
      }

      this.#registry.set(keyStr, e => subscriber.next(e));

      return () => this.#registry.delete(keyStr);
    });
  }

  makeBindStr(e: IKeyBind): KeyBindString {
    const mods = modifiers
      .filter(mod => e[mod])
      .map(mod => mod.slice(0, -3) as UnSuffixKey<typeof mod>)
      .map(modPrefix => `${modPrefix}+` as const);

    return (mods.join('') + e.key) as KeyBindString;
  }
}
