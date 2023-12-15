import { TestBed } from '@angular/core/testing';

import { MeasureToolService } from './measure-tool.service';

describe('MeasureToolService', () => {
  let service: MeasureToolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeasureToolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
