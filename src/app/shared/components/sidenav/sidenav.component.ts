import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { DialogOpenerService } from '../../services/dialog-opener.service';
import { ServiceWorkerService } from '../../services/service-worker.service';
import { MAPPER_VERSION } from '../../tokens/version.token';

@Component({
  selector: 'mapper-sidenav',
  standalone: true,
  imports: [MatListModule, AsyncPipe],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent {

  readonly mapperVersion = inject(MAPPER_VERSION).version;
  readonly dialogOpener = inject(DialogOpenerService);
  readonly #serviceWorker = inject(ServiceWorkerService);

  @Output()
  readonly buttonClicked = new EventEmitter<void>();

  checkForUpdate() {
    this.#serviceWorker.checkForUpdate().subscribe();
  }
}
