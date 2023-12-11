import { TestBed } from '@angular/core/testing';

import { FileTypeService } from './file-type.service';

describe('FileTypeService', () => {
  let service: FileTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
