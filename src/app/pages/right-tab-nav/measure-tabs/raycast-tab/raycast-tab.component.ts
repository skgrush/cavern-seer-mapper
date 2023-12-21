import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RaycastDistanceMode, RaycastDistanceToolService } from '../../../../shared/services/tools/raycast-distance-tool.service';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AbstractControl, FormControl, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LengthPipe } from "../../../../shared/pipes/length.pipe";
import { VectorPipe } from "../../../../shared/pipes/vector.pipe";
import { CeilingHeightAnnotation } from '../../../../shared/models/annotations/ceiling-height.annotation';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { TextInputDialogComponent } from '../../../../shared/components/text-input-dialog/text-input-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'mapper-raycast-tab',
  standalone: true,
  templateUrl: './raycast-tab.component.html',
  styleUrl: './raycast-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatListModule, MatMenuModule, FormsModule, ReactiveFormsModule, CommonModule, MatButtonToggleModule, MatButtonModule, LengthPipe, VectorPipe]
})
export class RaycastTabComponent {
  protected readonly RaycastDistanceMode = RaycastDistanceMode;
  protected readonly raycastDistanceTool = inject(RaycastDistanceToolService);
  readonly #dialog = inject(MatDialog);

  readonly modes = new Map(
    Object.values(RaycastDistanceMode)
      .filter((val): val is RaycastDistanceMode => typeof val === 'number')
      .map(mode => [mode, RaycastDistanceMode[mode]]),
  );

  readonly ceilingHeightSelectControl = new FormControl<CeilingHeightAnnotation[]>([], { nonNullable: true });

  clearSelection() {
    this.ceilingHeightSelectControl.reset();
  }

  deleteSelectedCeilingHeight() {
    const selection = this.ceilingHeightSelectControl.value;
    this.raycastDistanceTool.deleteCeilingHeights(selection);
  }

  rename() {
    const [selectedItem, ...others] = this.ceilingHeightSelectControl.value;
    if (!selectedItem || others.length > 0) {
      return;
    }

    const oldName = selectedItem.identifier;
    const renameValidator: ValidatorFn = (control: AbstractControl<string>) => {
      const newName = control.value;
      if (!newName) {
        return null;
      }
      if (!this.raycastDistanceTool.ceilingHeightRenameIsValid(oldName, newName)) {
        return { [`Name  ${JSON.stringify(newName)} is already in use`]: true };
      }
      return null;
    };

    TextInputDialogComponent.open(
      this.#dialog,
      {
        title: 'Rename a ceiling height',
        submitText: 'Rename',
        cancelText: 'Cancel',
        fieldLabel: `Rename ${selectedItem.identifier}`,
        inputType: 'text',
        validators: [Validators.required, renameValidator],
      }
    ).afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      this.raycastDistanceTool.renameCeilingHeight(selectedItem, result);
    });
  }
}
