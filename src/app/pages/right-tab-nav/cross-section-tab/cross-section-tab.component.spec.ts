import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrossSectionTabComponent } from './cross-section-tab.component';

describe('CrossSectionTabComponent', () => {
  let component: CrossSectionTabComponent;
  let fixture: ComponentFixture<CrossSectionTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrossSectionTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CrossSectionTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
