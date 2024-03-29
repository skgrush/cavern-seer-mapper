import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { ServiceWorkerService } from '../../shared/services/service-worker.service';
import { MAPPER_VERSION } from '../../shared/tokens/version.token';
import {
  ExportImageDialogOpener,
  ExportModelDialogOpener,
  OpenDialogOpener,
  SaveDialogOpener,
  SettingsDialogOpener,
} from '../../dialogs';
import { KeyBindDirective } from '../../shared/directives/key-bind.directive';
import { KeyBindIconComponent } from '../../shared/components/key-bind-icon/key-bind-icon.component';

@Component({
  selector: 'mapper-sidenav',
  standalone: true,
  imports: [MatListModule, AsyncPipe, NgIf, KeyBindDirective, KeyBindIconComponent],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent {

  readonly mapperVersion = inject(MAPPER_VERSION);
  readonly serviceWorker = inject(ServiceWorkerService);

  readonly openDialog = inject(OpenDialogOpener);
  readonly saveDialog = inject(SaveDialogOpener);
  readonly settingsDialog = inject(SettingsDialogOpener);
  readonly exportImageDialog = inject(ExportImageDialogOpener);
  readonly exportModelDialog = inject(ExportModelDialogOpener);
}
