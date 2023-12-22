import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompassComponent } from './compass.component';

describe('CompassComponent', () => {
  let component: CompassComponent;
  let fixture: ComponentFixture<CompassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompassComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
