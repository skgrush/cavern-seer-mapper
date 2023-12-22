import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CanvasService } from '../../shared/services/canvas.service';
import { ResizeService } from '../../shared/services/resize.service';
import { debounceTime, map, tap } from 'rxjs';
import { ThemeService } from '../../shared/services/theme.service';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { ToolManagerService } from '../../shared/services/tool-manager.service';

@Component({
  selector: 'mapper-canvas',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas')
  canvasElement!: ElementRef<HTMLCanvasElement>;

  readonly #destroyRef = inject(DestroyRef);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly #pixelRatio =
    this.#isBrowser
      ? window.devicePixelRatio
      : 1;

  readonly #eleRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly #canvasService = inject(CanvasService);
  readonly #resizeService = inject(ResizeService);
  readonly #themeService = inject(ThemeService);
  readonly #toolService = inject(ToolManagerService);

  readonly toolCursor$ = this.#toolService.currentToolCursor$;

  ngAfterViewInit(): void {
    this.#init();
  }

  ngOnDestroy(): void {
    this.#canvasService.cleanupRenderer();
  }

  #init() {
    if (!this.#isBrowser) {
      return;
    }
    const rect = this.#eleRef.nativeElement.getBoundingClientRect();
    this.#canvasService.initializeRenderer(this.canvasElement.nativeElement, rect, this.#pixelRatio);

    this.#resizeService.observe$(this.#eleRef).pipe(
      debounceTime(100),
      tap(size => this.#canvasService.resize(size)),
      tap(() => console.count('canvas resize')),
      takeUntilDestroyed(this.#destroyRef),
    ).subscribe();

    this.#themeService.backgroundColor$.pipe(
      map(bgColor => this.#canvasService.setBgColor(bgColor)),
    ).subscribe();

    this.#canvasService.render$().subscribe();
  }
}
