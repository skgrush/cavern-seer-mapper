import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasureTabsComponent } from './measure-tabs.component';

describe('MeasureTabsComponent', () => {
  let component: MeasureTabsComponent;
  let fixture: ComponentFixture<MeasureTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeasureTabsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MeasureTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
