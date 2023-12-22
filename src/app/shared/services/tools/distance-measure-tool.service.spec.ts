import { TestBed } from '@angular/core/testing';

import { DistanceMeasureToolService } from './distance-measure-tool.service';

describe('MeasureToolService', () => {
  let service: DistanceMeasureToolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DistanceMeasureToolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
