import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrossSectionDetailsFormComponent } from './cross-section-details-form.component';

describe('CrossSectionDetailsFormComponent', () => {
  let component: CrossSectionDetailsFormComponent;
  let fixture: ComponentFixture<CrossSectionDetailsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrossSectionDetailsFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CrossSectionDetailsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
