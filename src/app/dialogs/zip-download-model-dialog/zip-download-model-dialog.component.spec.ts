import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZipDownloadModelDialogComponent } from './zip-download-model-dialog.component';

describe('ZipDownloadModelDialogComponent', () => {
  let component: ZipDownloadModelDialogComponent;
  let fixture: ComponentFixture<ZipDownloadModelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZipDownloadModelDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ZipDownloadModelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
