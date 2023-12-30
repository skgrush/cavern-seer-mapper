import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUrlLoaderComponent } from './file-url-loader.component';

describe('FileUrlLoaderComponent', () => {
  let component: FileUrlLoaderComponent;
  let fixture: ComponentFixture<FileUrlLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUrlLoaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileUrlLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
