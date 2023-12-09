import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OpenDialogComponent } from '../open-dialog/open-dialog.component';
import { ModelManagerService } from '../../services/model-manager.service';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';
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
  readonly #exportService = inject(ExportService);
  readonly #dialog = inject(MatDialog);

  readonly saving$ = new BehaviorSubject(false);

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
    if (this.saving$.value) {
      return;
    }
    this.saving$.next(true);

    this.#exportService.downloadZip$(9).subscribe(result => {
      this.saving$.next(false);
    });
  }
}
