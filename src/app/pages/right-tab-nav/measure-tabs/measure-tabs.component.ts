import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RaycastTabComponent } from "./raycast-tab/raycast-tab.component";
import { DistanceMeasureTabComponent } from "./distance-measure-tab/distance-measure-tab.component";

@Component({
  selector: 'mapper-measure-tabs',
  standalone: true,
  templateUrl: './measure-tabs.component.html',
  styleUrl: './measure-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, RaycastTabComponent, DistanceMeasureTabComponent]
})
export class MeasureTabsComponent {

}
