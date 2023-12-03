import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OpenDialogComponent } from '../open-dialog/open-dialog.component';


@Component({
  selector: 'mapper-sidenav',
  standalone: true,
  imports: [MatListModule, MatDialogModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent {

  readonly #dialog = inject(MatDialog);

  open() {
    this.#dialog.open(OpenDialogComponent);
  }
}
