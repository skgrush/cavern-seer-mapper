import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { CanvasService } from '../../services/canvas.service';

@Component({
  selector: 'mapper-compass',
  standalone: true,
  imports: [],
  template: '',
  styleUrl: './compass.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompassComponent implements AfterViewInit, OnDestroy {
  readonly #canvasService = inject(CanvasService);
  readonly #compassDiv = new BehaviorSubject<HTMLElement | undefined>(undefined);

  readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    this.#init();
  }

  ngOnDestroy(): void {
    this.#compassDiv.complete();
  }

  #init() {
    this.#compassDiv.next(this.#elementRef.nativeElement);
    this.#canvasService.registerCompass(this.#compassDiv.asObservable());
  }
}
