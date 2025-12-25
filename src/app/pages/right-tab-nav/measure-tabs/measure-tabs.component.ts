import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { CeilingTabComponent } from "./ceiling-tab/ceiling-tab.component";
import { DistanceMeasureTabComponent } from "./distance-measure-tab/distance-measure-tab.component";

@Component({
  selector: 'mapper-measure-tabs',
  templateUrl: './measure-tabs.component.html',
  styleUrl: './measure-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, CeilingTabComponent, DistanceMeasureTabComponent]
})
export class MeasureTabsComponent {

}
