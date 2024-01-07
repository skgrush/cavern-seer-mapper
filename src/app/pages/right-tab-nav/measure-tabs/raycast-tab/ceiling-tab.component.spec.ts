import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CeilingTabComponent } from './ceiling-tab.component';

describe('RaycastTabComponent', () => {
  let component: CeilingTabComponent;
  let fixture: ComponentFixture<CeilingTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CeilingTabComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CeilingTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
