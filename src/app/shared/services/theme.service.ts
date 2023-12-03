import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

@Injectable()
export class ThemeService {
  readonly #document = inject(DOCUMENT);

  readonly #theme = new BehaviorSubject('dark');
  readonly backgroundColor$ = this.#theme.pipe(
    map(() => this.getAppBackground()),
  );

  getStyle(ele: HTMLElement, style: string) {
    return getComputedStyle(ele).getPropertyValue(style);
  }

  getAppBackground() {
    return this.getStyle(this.#document.body, 'background-color');
  }
}
