import { BehaviorSubject, Observable } from 'rxjs';

/**
 * When observed, set the subject to the given value.
 * When unsubscribed, set the subject back to its original value.
 */
export function temporarilySet$<T>(subject: BehaviorSubject<T>, to: T) {
  return new Observable<void>(() => {
    const originalValue = subject.value;
    if (originalValue !== to) {
      subject.next(to);
      return () => subject.next(originalValue);
    }
    return () => undefined;
  });
}
