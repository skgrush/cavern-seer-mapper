import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { KeyBindContext } from '../../directives/key-bind.directive';
import { map } from 'rxjs';
import { KeyBindService } from '../../services/key-bind.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'mapper-key-bind-icon',
  standalone: true,
  imports: [
    AsyncPipe,
  ],
  templateUrl: './key-bind-icon.component.html',
  styleUrl: './key-bind-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyBindIconComponent {
  readonly #keyBindContext = inject(KeyBindContext);
  readonly #keyBindService = inject(KeyBindService);

  readonly localizedStr$ = this.#keyBindContext.keyBindString$.pipe(
    map(str => this.#keyBindService.localizeKeyBindString(str)),
  )
}
