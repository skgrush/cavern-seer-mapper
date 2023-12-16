import { filter } from "rxjs";

export function ignoreNullish<T>() {
  return filter((f: T): f is Exclude<T, null | undefined> => f !== null && f !== undefined);
}
