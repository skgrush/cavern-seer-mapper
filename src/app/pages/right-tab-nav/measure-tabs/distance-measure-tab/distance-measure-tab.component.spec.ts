import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistanceMeasureTabComponent } from './distance-measure-tab.component';

describe('MeasureTabComponent', () => {
  let component: DistanceMeasureTabComponent;
  let fixture: ComponentFixture<DistanceMeasureTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DistanceMeasureTabComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DistanceMeasureTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
