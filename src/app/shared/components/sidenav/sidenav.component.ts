import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { ModelManagerService } from '../../services/model-manager.service';
import { OpenDialogComponent } from '../open-dialog/open-dialog.component';
import { ZipDownloadModelDialogComponent } from '../zip-download-model-dialog/zip-download-model-dialog.component';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { ExportService } from '../../services/export.service';


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

  // TODO: tmp
  readonly #export = inject(ExportService);

  open() {
    OpenDialogComponent.open(this.#dialog, {
      submitText: 'Open',
      titleText: 'Open a file',
      multiple: false,
    }).afterClosed().subscribe(result => {
      if (result) {
        this.#modelManager.resetToNonGroupModel(result[0]);
      }
    });
  }

  import() {
    OpenDialogComponent.open(this.#dialog, {
      submitText: 'Import',
      titleText: 'Import one or more files',
      multiple: true,
    }).afterClosed().subscribe(result => {
      if (result) {
        this.#modelManager.importModels(result);
      }
    });
  }

  save() {
    ZipDownloadModelDialogComponent.open(this.#dialog, {
      titleText: 'Zip and download group',
    });
  }

  settings() {
    SettingsDialogComponent.open(this.#dialog);
  }

  exportImage() {
    this.#export.downloadCanvasImage$('test', 'png', 1).subscribe(() => {
      console.info('done');
    })
  }
}
