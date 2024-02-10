import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportModelDialogComponent } from './export-model-dialog.component';

describe('ExportModelDialogComponent', () => {
  let component: ExportModelDialogComponent;
  let fixture: ComponentFixture<ExportModelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportModelDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExportModelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
