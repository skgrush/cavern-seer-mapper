import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'mapper-measure-tabs',
  standalone: true,
  imports: [MatTabsModule],
  templateUrl: './measure-tabs.component.html',
  styleUrl: './measure-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeasureTabsComponent {

}
