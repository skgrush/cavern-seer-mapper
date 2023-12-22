import { filter } from "rxjs";

export function ignoreNullishArray<T>(f: T): f is Exclude<T, null | undefined> {
  return f !== null && f !== undefined;
}

export function ignoreNullish<T>() {
  return filter(ignoreNullishArray<T>);
}
