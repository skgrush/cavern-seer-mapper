import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CanvasService } from '../../shared/services/canvas.service';
import { ResizeService } from '../../shared/services/resize.service';
import { debounceTime, map, tap } from 'rxjs';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'mapper-canvas',
  standalone: true,
  imports: [],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas')
  canvasElement!: ElementRef<HTMLCanvasElement>;

  readonly #destroyRef = inject(DestroyRef);
  readonly #eleRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly #canvasService = inject(CanvasService);
  readonly #resizeService = inject(ResizeService);
  readonly #themeService = inject(ThemeService);

  ngAfterViewInit(): void {
    this.#init();
  }

  ngOnDestroy(): void {
    this.#canvasService.cleanupRenderer();
  }

  #init() {
    const rect = this.#eleRef.nativeElement.getBoundingClientRect();
    this.#canvasService.initializeRenderer(this.canvasElement.nativeElement, rect);

    this.#resizeService.observe$(this.#eleRef).pipe(
      debounceTime(100),
      tap(size => this.#canvasService.resize(size)),
      tap(() => console.count('count')),
      takeUntilDestroyed(this.#destroyRef),
    ).subscribe();

    this.#themeService.backgroundColor$.pipe(
      map(bgColor => this.#canvasService.setBgColor(bgColor)),
    ).subscribe();
  }
}
