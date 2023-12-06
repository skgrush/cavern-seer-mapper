import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModelManagerService } from '../../services/model-manager.service';
import { BehaviorSubject, of, startWith, switchMap, take, tap } from 'rxjs';
import { BaseRenderModel } from '../../models/render/base.render-model';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { GroupRenderModel } from '../../models/render/group.render-model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'mapper-model-nav-list',
  standalone: true,
  imports: [MatTreeModule, NgIf, AsyncPipe],
  templateUrl: './model-nav-list.component.html',
  styleUrl: './model-nav-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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

  readonly treeControl = new NestedTreeControl<BaseRenderModel<any>>(
    m => this.canHaveChildren(0, m) ? m.children : null
  );
  readonly dataSource = new MatTreeNestedDataSource<BaseRenderModel<any>>();

  readonly selectedModel = new BehaviorSubject<BaseRenderModel<any> | undefined>(undefined);

  constructor() {
    this.currentOpenOrChildOrPropChanged$.pipe(
      takeUntilDestroyed(),
      switchMap(() => this.currentOpen$.pipe(take(1))),
      tap(group => this.dataSource.data = group ? [group] : []),
    ).subscribe();
  }

  selectModel(model?: BaseRenderModel<any>) {
    this.selectedModel.next(model);
  }

  protected trackBy(this: unknown, i: number, item: BaseRenderModel<any>) {
    return item;
  }

  protected canHaveChildren(this: unknown, i: number, item: BaseRenderModel<any>): item is GroupRenderModel {
    return item instanceof GroupRenderModel;
  }
}
