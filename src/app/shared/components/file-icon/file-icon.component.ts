import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FileModelType } from '../../models/model-type.enum';
import { NgIf } from '@angular/common';

@Component({
  selector: 'mapper-file-icon',
  standalone: true,
  imports: [MatIconModule, NgIf],
  templateUrl: './file-icon.component.html',
  styleUrl: './file-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileIconComponent {

  @Input({ required: true })
  type!: FileModelType;

  readonly fileTypeIcons = Object.freeze({
    '': 'question_mark',
    group: 'folder_zip',
    gltf: 'svg:glTF_White',
    obj: 'shape_line',
  } satisfies Record<FileModelType, string>);


}
