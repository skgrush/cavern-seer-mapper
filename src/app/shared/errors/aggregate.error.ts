

export class AggregateError extends Error {
  readonly #errors: Error[];

  get errors() {
    return [...this.#errors];
  }

  constructor(message: string, errors: Error[]) {
    const msg = `${message}\n${errors.map(String).join('\n')}`;
    super(msg);

    this.#errors = errors;
  }
}
