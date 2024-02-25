import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { DialogOpenerService } from '../../shared/services/dialog-opener.service';
import { ServiceWorkerService } from '../../shared/services/service-worker.service';
import { MAPPER_VERSION } from '../../shared/tokens/version.token';
import { OpenDialogOpener } from '../../dialogs/open-dialog/open-dialog.opener';

@Component({
  selector: 'mapper-sidenav',
  standalone: true,
  imports: [MatListModule, AsyncPipe, NgIf],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent {

  readonly mapperVersion = inject(MAPPER_VERSION);
  readonly dialogOpener = inject(DialogOpenerService);
  readonly #serviceWorker = inject(ServiceWorkerService);

  readonly openDialog = inject(OpenDialogOpener);

  checkForUpdate() {
    this.#serviceWorker.checkForUpdate().subscribe();
  }
}
