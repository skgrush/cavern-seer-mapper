import { ChangeDetectionStrategy, Component, HostBinding, inject } from '@angular/core';
import { KeyBindContext } from '../../directives/key-bind.directive';
import { map, shareReplay } from 'rxjs';
import { KeyBindService } from '../../services/key-bind.service';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'mapper-key-bind-icon',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
  ],
  templateUrl: './key-bind-icon.component.html',
  styleUrl: './key-bind-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyBindIconComponent {
  readonly #keyBindContext = inject(KeyBindContext);
  readonly #keyBindService = inject(KeyBindService);
  readonly icons = this.#keyBindService.icons;

  @HostBinding('class.icons-symbolic')
  readonly iconsSymbolic = this.icons.symbolic;

  readonly obj$ = this.#keyBindContext.keyBindString$.pipe(
    map(str => this.#keyBindService.bindStringToObject(str)),
    shareReplay(1),
  )
}
