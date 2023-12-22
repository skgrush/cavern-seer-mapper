import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { ModelManagerService } from '../../services/model-manager.service';

@Component({
  selector: 'mapper-sidenav',
  standalone: true,
  imports: [MatListModule, MatDialogModule, AsyncPipe],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent {

  readonly #modelManager = inject(ModelManagerService);
  readonly #dialog = inject(MatDialog);

  open() {
    import('../../../dialogs/open-dialog/open-dialog.component')
      .then(({ OpenDialogComponent }) => {
        OpenDialogComponent.open(this.#dialog, {
          submitText: 'Open',
          titleText: 'Open a file',
          multiple: false,
        }).afterClosed().subscribe(result => {
          if (result) {
            this.#modelManager.resetToNonGroupModel(result[0]);
          }
        });
      });

  }

  import() {
    import('../../../dialogs/open-dialog/open-dialog.component')
      .then(({ OpenDialogComponent }) => {
        OpenDialogComponent.open(this.#dialog, {
          submitText: 'Import',
          titleText: 'Import one or more files',
          multiple: true,
        }).afterClosed().subscribe(result => {
          if (result) {
            this.#modelManager.importModels(result);
          }
        });
      });
  }

  save() {
    import('../../../dialogs/zip-download-model-dialog/zip-download-model-dialog.component')
      .then(({ ZipDownloadModelDialogComponent }) => {
        ZipDownloadModelDialogComponent.open(this.#dialog, {
          titleText: 'Zip and download group',
        });
      });
  }

  settings() {
    import('../../../dialogs/settings-dialog/settings-dialog.component')
      .then(({ SettingsDialogComponent }) => {
        SettingsDialogComponent.open(this.#dialog);
      });
  }

  exportImage() {
    import('../../../dialogs/export-image-dialog/export-image-dialog.component')
      .then(({ ExportImageDialogComponent }) => {
        ExportImageDialogComponent.open(
          this.#dialog,
          {
            titleText: 'Export image',
          },
        );
      });
  }
}
