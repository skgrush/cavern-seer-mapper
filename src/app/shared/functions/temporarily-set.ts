import { BehaviorSubject, Observable } from 'rxjs';
import { untracked, WritableSignal } from '@angular/core';

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

/**
 * When observed, set the signal to the given value.
 * When unsubscribed, set the signal back to its original value.
 */
export function temporarilySetSignal<T>(subject: WritableSignal<T>, to: T) {
  return new Observable<void>(() => {
    const originalValue = untracked(subject);
    if (originalValue !== to) {
      subject.set(to);
      return () => subject.set(originalValue);
    }
    return () => undefined;
  });
}
