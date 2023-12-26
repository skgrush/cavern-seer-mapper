import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrossSectionRenderDialogComponent } from './cross-section-render-dialog.component';

describe('CrossSectionRenderDialogComponent', () => {
  let component: CrossSectionRenderDialogComponent;
  let fixture: ComponentFixture<CrossSectionRenderDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrossSectionRenderDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CrossSectionRenderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
