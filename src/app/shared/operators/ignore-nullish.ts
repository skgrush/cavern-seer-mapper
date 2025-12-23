import { filter } from "rxjs";

export function ignoreNullish<T>() {
  return filter((x: T): x is NonNullable<T> => x !== null && x !== undefined);
}
