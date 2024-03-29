import { inject, Injectable } from '@angular/core';
import { filter, fromEvent, map, Observable } from 'rxjs';
import { ErrorService } from './error.service';
import { Platform, PlatformService } from './platform.service';

type LowerCaseCharacter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';
type NumericCharacter = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type SpecialCharacter = ' ' | '`' | '~' | '!' | '@' | '#' | '$' | '%' | '^' | '&' | '*' | '(' | ')' | '-' | '_' | '+' | '=' | '[' | '{' | '}' | ']' | '\\' | '|' | ';' | ':' | '"' | '\'' | ',' | '<' | '>' | '.' | '?' | '/';

type KeyCharacter = LowerCaseCharacter | NumericCharacter | SpecialCharacter;

type IKeyBind<TKey extends KeyCharacter = KeyCharacter> = {
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly shiftKey?: boolean;
  readonly metaKey?: boolean;
  readonly key: TKey;
}

const modifiers = ['ctrlKey', 'altKey', 'shiftKey', 'metaKey'] as const satisfies readonly (keyof IKeyBind)[];

export type KeyBindString = `${'ctrl+'|''}${'alt+'|''}${'shift+'|''}${'meta+'|''}${KeyCharacter}`;

type UnSuffixKey<T extends `${string}Key`> = T extends `${infer K}Key` ? K : never;

@Injectable()
export class KeyBindService {
  readonly #errorService = inject(ErrorService);
  readonly #platform = inject(PlatformService);

  readonly #registry = new Map<KeyBindString, (e: KeyboardEvent) => void>();

  readonly icons: Record<typeof modifiers[number], string> & { symbolic: boolean };

  constructor() {
    switch (this.#platform.platform) {
      case Platform.MacOS:
      case Platform.iDevice:
        this.icons = { symbolic: true, ctrlKey: '⌃', altKey: '⌥', shiftKey: '⇧', metaKey: '⌘' };
        break;
      case Platform.Android:
      case Platform.Linux:
      case Platform.Windows:
      default:
        this.icons = { symbolic: false, ctrlKey: 'Ctrl', altKey: 'Alt', shiftKey: 'Shift', metaKey: '⊞' };
        break;
    }
  }


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
    console.debug('keyEventCalled', bindStr);

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

    return (mods.join('') + e.key.toLowerCase()) as KeyBindString;
  }

  localizeKeyBindString(str: KeyBindString) {
    const obj = this.bindStringToObject(str);
    const icons = this.icons;

    const parts = modifiers
      .filter(mod => obj[mod])
      .map(mod => icons[mod])
      .concat(obj.key);

    return parts.join(icons.symbolic ? '' : '+');
  }

  #plusSplitter = /(?<!\+)\+/;
  bindStringToObject(str: KeyBindString): IKeyBind {
    const parts = str.split(this.#plusSplitter).filter(i => i);
    const key = parts[parts.length - 1] as KeyCharacter;

    return {
      key,
      altKey: parts.includes('alt'),
      metaKey: parts.includes('meta'),
      ctrlKey: parts.includes('ctrl'),
      shiftKey: parts.includes('shift'),
    };
  }
}
