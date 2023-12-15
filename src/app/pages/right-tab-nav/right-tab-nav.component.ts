import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModelNavListComponent } from "../../shared/components/model-nav-list/model-nav-list.component";
import { MatTabsModule } from '@angular/material/tabs';
import { MeasureTabsComponent } from "./measure-tabs/measure-tabs.component";

@Component({
  selector: 'mapper-right-tab-nav',
  standalone: true,
  templateUrl: './right-tab-nav.component.html',
  styleUrl: './right-tab-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModelNavListComponent, MatTabsModule, MeasureTabsComponent]
})
export class RightTabNavComponent {

}
