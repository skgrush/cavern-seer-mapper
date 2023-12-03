import { ElementRef, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type ISize = {
  readonly width: number;
  readonly height: number;
}

@Injectable()
export class ResizeService {

  constructor() { }

  observe$(eleRef: ElementRef) {
    return new Observable<DOMRectReadOnly>(subscriber => {
      const ro = new ResizeObserver(([entry]) => {
        subscriber.next(entry.contentRect);
      });
      ro.observe(eleRef.nativeElement);

      return () => ro.disconnect();
    });
  }
}
