import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

declare global {
  interface LaunchParams {
    readonly files: readonly FileSystemHandle[];
    readonly targetURL: string;
  }
  interface LaunchQueue {
    setConsumer(consumer: (launchParams: LaunchParams) => void): void;
  }

  interface Window {
    launchQueue?: LaunchQueue;
  }
}

@Injectable()
export class LaunchQueueService {

  readonly launchQueueConsumer$ = new Observable<LaunchParams | null>(subscriber => {
    if (!window.launchQueue) {
      subscriber.next(null);
      return;
    }

    window.launchQueue.setConsumer(launchParams => {
      subscriber.next(launchParams);
    });
  }).pipe(
    takeUntilDestroyed(),
    shareReplay(1),
  );
}
