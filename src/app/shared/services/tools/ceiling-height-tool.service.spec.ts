import { TestBed } from '@angular/core/testing';

import { CeilingHeightToolService } from './ceiling-height-tool.service';

describe('CeilingHeightToolService', () => {
  let service: CeilingHeightToolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CeilingHeightToolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
