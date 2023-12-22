import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaycastTabComponent } from './raycast-tab.component';

describe('RaycastTabComponent', () => {
  let component: RaycastTabComponent;
  let fixture: ComponentFixture<RaycastTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaycastTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RaycastTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
