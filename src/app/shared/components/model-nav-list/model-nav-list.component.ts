import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModelManagerService } from '../../services/model-manager.service';
import { BehaviorSubject, of, startWith, switchMap, take, tap } from 'rxjs';
import { BaseRenderModel } from '../../models/render/base.render-model';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { GroupRenderModel } from '../../models/render/group.render-model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe, NgIf } from '@angular/common';
import { ModelDetailFormComponent } from "../model-detail-form/model-detail-form.component";
import { FileModelType } from '../../models/model-type.enum';
import { FileIconComponent } from '../file-icon/file-icon.component';
import { MatRippleModule } from '@angular/material/core';
import {MatDividerModule} from "@angular/material/divider";

interface INode {
  identifier: string;
  type: FileModelType;
  model: BaseRenderModel<any>;
  children?: INode[];
}

function transformToNode(model: BaseRenderModel<any>): INode {
  return {
    identifier: model.identifier,
    type: model.type,
    model,
    children: model instanceof GroupRenderModel
      ? model.children.map(c => transformToNode(c))
      : undefined
  }
}

@Component({
  selector: 'mapper-model-nav-list',
  standalone: true,
  templateUrl: './model-nav-list.component.html',
  styleUrl: './model-nav-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTreeModule, NgIf, AsyncPipe, ModelDetailFormComponent, FileIconComponent, MatRippleModule, MatDividerModule]
})
export class ModelNavListComponent {

  readonly #modelManager = inject(ModelManagerService);

  readonly currentOpen$ = this.#modelManager.currentOpenGroup$;
  readonly currentOpenOrChildOrPropChanged$ = this.currentOpen$.pipe(
    switchMap(model => model
      ? model.childOrPropertyChanged$.pipe(startWith(undefined))
      : of(undefined),
    ),
  );

  readonly treeControl = new NestedTreeControl<INode>(
    m => m.children
  );
  readonly dataSource = new MatTreeNestedDataSource<INode>();

  readonly selectedModel = new BehaviorSubject<BaseRenderModel<any> | undefined>(undefined);

  constructor() {
    this.currentOpenOrChildOrPropChanged$.pipe(
      takeUntilDestroyed(),
      switchMap(() => this.currentOpen$.pipe(take(1))),
      tap(group => {
        this.dataSource.data = group
          ? [transformToNode(group)]
          : [];
      }),
    ).subscribe();
  }

  selectModel(event: MouseEvent, node: undefined | INode) {
    console.info('selectModel', event, node);
    this.selectedModel.next(node?.model);
    event.stopPropagation();
  }

  protected trackBy(this: unknown, i: number, item: INode) {
    return item;
  }

  protected canHaveChildren(this: unknown, i: number, item: INode) {
    return !!item.children?.length;
  }
}
