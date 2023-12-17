import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportImageDialogComponent } from './export-image-dialog.component';

describe('ExportImageDialogComponent', () => {
  let component: ExportImageDialogComponent;
  let fixture: ComponentFixture<ExportImageDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportImageDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExportImageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
