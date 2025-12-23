
export function makeResult<TExpected>(result: TExpected | undefined, error?: Error): Result<TExpected> {
  return new ResultIMPL(error, result) as Result<TExpected>;
}

const resultSymbol = Symbol('Result');

export type ResultFailure<TExpected> =
  { readonly success: false, readonly failure: true, readonly error: Error, readonly [resultSymbol]: true };
export type ResultSuccess<TExpected> =
  { readonly success: true, readonly failure: false, readonly result: TExpected, readonly [resultSymbol]: true };

export type Result<TExpected> =
  | ResultFailure<TExpected>
  | ResultSuccess<TExpected>;

export function filterSuccesses<TExpected>(results: Iterable<Result<TExpected>>) {
  return [...results]
    .filter((r) => r.success);
}
export function filterErrors<TExpected>(results: Iterable<Result<TExpected>>) {
  return [...results]
    .filter((r) => r.failure);
}


class ResultIMPL<TExpected> {
  readonly #success: boolean;
  readonly #error?: Error;
  readonly #result?: TExpected;

  readonly [resultSymbol] = true;

  get result() {
    return this.#result;
  }
  get error() {
    return this.#error;
  }

  get success() {
    return this.#success;
  }
  get failure() {
    return !this.#success;
  }

  constructor(error: Error | undefined, result?: TExpected) {
    this.#success = !error;
    this.#result = result;
  }
}
