import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModelManagerService } from '../../../shared/services/model-manager.service';
import { BehaviorSubject, of, startWith, switchMap, take, tap } from 'rxjs';
import { BaseRenderModel } from '../../../shared/models/render/base.render-model';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { GroupRenderModel } from '../../../shared/models/render/group.render-model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { ModelDetailFormComponent } from '../../../shared/components/model-detail-form/model-detail-form.component';
import { FileModelType } from '../../../shared/models/model-type.enum';
import { FileIconComponent } from '../../../shared/components/file-icon/file-icon.component';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatIcon } from '@angular/material/icon';

interface INode {
  identifier: string;
  type: FileModelType;
  model: BaseRenderModel<any>;
  children: INode[] | undefined;
  parent: GroupRenderModel | undefined;
}

function transformToNode(model: BaseRenderModel<any>, parent?: GroupRenderModel): INode {
  return {
    identifier: model.identifier,
    type: model.type,
    model,
    parent,
    children: model instanceof GroupRenderModel
      ? model.children.map(c => transformToNode(c, model))
      : undefined
  }
}

@Component({
  selector: 'mapper-model-nav-list',
  templateUrl: './model-nav-list.component.html',
  styleUrl: './model-nav-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTreeModule, AsyncPipe, ModelDetailFormComponent, FileIconComponent, MatRippleModule, MatDividerModule, DragDropModule, MatIcon],
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

  readonly selectedModel$ = new BehaviorSubject<BaseRenderModel<any> | undefined>(undefined);

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

  selectModel(event: MouseEvent, node: INode | null) {
    console.info('selectModel', event, node);
    this.selectedModel$.next(node?.model);
    event.stopPropagation();
  }

  drop(e: CdkDragDrop<{}, {}, { node: INode }>) {
    console.warn('drop', e);

    const { previousIndex, currentIndex } = e;
    const { model, parent } = e.item.data.node;
    if (previousIndex === currentIndex) {
      return;
    }
    if (!parent) {
      console.warn('Cannot drag top level model');
      return;
    }

    // TODO: this needs a lot of work if we want multi-level hierarchies to work

    const flattened = this.#calculateFlattenedNodes();

    const firstSiblingIndex = flattened.findIndex(nod => nod.parent === parent);

    const parentRelativePrevious = previousIndex - firstSiblingIndex;
    const parentRelativeCurrent = currentIndex - firstSiblingIndex;

    parent.reorderModels(parentRelativeCurrent, parentRelativePrevious);
  }

  protected trackBy(this: unknown, i: number, item: INode) {
    return item;
  }

  protected canHaveChildren(this: unknown, i: number, item: INode) {
    return !!item.children?.length;
  }

  #calculateFlattenedNodes(flattened: INode[] = [], currentNode?: INode) {
    if (!currentNode) {
      for (const node of this.dataSource.data) {
        this.#calculateFlattenedNodes(flattened, node);
      }
      return flattened;
    }

    // flattened.push(currentNode);
    if (!currentNode.children) {
      flattened.push(currentNode);
    } else {
      for (const childNode of currentNode.children) {
        this.#calculateFlattenedNodes(flattened, childNode);
      }
    }
    return flattened;
  }
}
