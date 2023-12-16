import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasureTabComponent } from './measure-tab.component';

describe('MeasureTabComponent', () => {
  let component: MeasureTabComponent;
  let fixture: ComponentFixture<MeasureTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeasureTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MeasureTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
