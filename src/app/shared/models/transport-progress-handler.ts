import { BehaviorSubject, distinctUntilChanged, map } from "rxjs";

type IProgress = {
  readonly loaded: number;
  readonly total: number;
  readonly determinate: boolean;
  readonly active: boolean;
  readonly stage?: string;
}

export class TransportProgressHandler {

  static #newProgress(): IProgress {
    return {
      loaded: 0,
      total: Infinity,
      determinate: false,
      active: false,
    };
  }

  #progress = new BehaviorSubject(TransportProgressHandler.#newProgress());

  readonly progress$ = this.#progress.asObservable();
  readonly isActive$ = this.progress$.pipe(
    map(({ active }) => active),
    distinctUntilChanged(),
  );

  get isActive() {
    return this.#progress.value.active;
  }

  addToLoadedCount(newPartialLoad: number, stage?: string) {
    const current = { ...this.#progress.value };

    current.loaded += newPartialLoad;;
    current.stage = stage;
    this.#progress.next(current);
  }

  setLoadedCount(newLoad: number, stage?: string) {
    const current = { ...this.#progress.value };

    current.loaded = newLoad;
    current.stage = stage;
    this.#progress.next(current);
  }

  setLoadPercent(percent: number, stage?: string) {
    const current = { ...this.#progress.value };


    current.loaded = Math.round(
      current.total * percent / 100
    );
    current.stage = stage;
    this.#progress.next(current);
  }

  changeTotal(total: number) {
    const current = { ...this.#progress.value };

    current.total = total;
    current.determinate = Number.isFinite(total);
    this.#progress.next(current);
  }

  addToTotal(add: number, resetIfIndeterminate?: boolean) {
    const current = this.#progress.value;
    let total = current.total;
    if (!current.determinate && resetIfIndeterminate) {
      total = 0;
    }
    this.changeTotal(total + add);
  }

  reset(active: boolean) {
    this.#progress.next({
      ...TransportProgressHandler.#newProgress(),
      active,
    });
  }
  deactivate() {
    this.#progress.next({
      ...this.#progress.value,
      active: false,
    });
  }

  // reopen() {
  //   if (!this.#progress.closed) {
  //     this.#progress.complete();
  //   }
  //   this.#progress = TransportHandler.#newProgress();
  // }

  // close() {
  //   this.#progress.complete();
  // }
}
