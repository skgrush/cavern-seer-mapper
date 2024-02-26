import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { DialogOpenerService } from '../../shared/services/dialog-opener.service';
import { ServiceWorkerService } from '../../shared/services/service-worker.service';
import { MAPPER_VERSION } from '../../shared/tokens/version.token';
import { ExportImageDialogOpener, OpenDialogOpener, SaveDialogOpener, SettingsDialogOpener } from '../../dialogs';

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
  readonly saveDialog = inject(SaveDialogOpener);
  readonly settingsDialog = inject(SettingsDialogOpener);
  readonly exportImageDialog = inject(ExportImageDialogOpener);

  checkForUpdate() {
    this.#serviceWorker.checkForUpdate().subscribe();
  }
}
