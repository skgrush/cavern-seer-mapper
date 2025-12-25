import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CeilingHeightToolService } from '../../../../shared/services/tools/ceiling-height-tool.service';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { AbstractControl, FormControl, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LengthPipe } from "../../../../shared/pipes/length.pipe";
import { VectorPipe } from "../../../../shared/pipes/vector.pipe";
import { CeilingHeightAnnotation } from '../../../../shared/models/annotations/ceiling-height.annotation';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { controlValueSignal } from '../../../../shared/functions/control-value-signal';

@Component({
  selector: 'mapper-ceiling-tab',
  templateUrl: './ceiling-tab.component.html',
  styleUrl: './ceiling-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatListModule, MatMenuModule, FormsModule, ReactiveFormsModule, CommonModule, MatButtonModule, LengthPipe, VectorPipe, MatTooltip],
})
export class CeilingTabComponent {
  protected readonly ceilingHeightTool = inject(CeilingHeightToolService);
  readonly #dialog = inject(MatDialog);

  readonly ceilingHeightSelectControl = new FormControl<readonly CeilingHeightAnnotation[]>([], { nonNullable: true });

  readonly ceilingHeightSelectValue = controlValueSignal(this.ceilingHeightSelectControl);

  clearSelection() {
    this.ceilingHeightSelectControl.reset();
  }

  deleteSelectedCeilingHeight() {
    const selection = this.ceilingHeightSelectControl.value;
    this.ceilingHeightTool.deleteCeilingHeights(selection);
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
      if (!this.ceilingHeightTool.ceilingHeightRenameIsValid(oldName, newName)) {
        return { [`Identifier ${JSON.stringify(newName)} is already in use`]: true };
      }
      return null;
    };

    import('../../../../dialogs/text-input-dialog/text-input-dialog.component')
      .then(({ TextInputDialogComponent }) =>
        TextInputDialogComponent.open(
          this.#dialog,
          {
            title: 'Rename a ceiling height',
            submitText: 'Rename',
            cancelText: 'Cancel',
            fieldLabel: `Rename ${oldName}`,
            inputType: 'text',
            validators: [Validators.required, renameValidator],
          }
        ).afterClosed().subscribe(result => {
          if (!result) {
            return;
          }
          this.ceilingHeightTool.renameCeilingHeight(selectedItem, result);
        })
      );
  }
}
