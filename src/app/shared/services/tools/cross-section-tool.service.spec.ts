import { TestBed } from '@angular/core/testing';

import { CrossSectionToolService } from './cross-section-tool.service';

describe('CrossSectionToolService', () => {
  let service: CrossSectionToolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrossSectionToolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
