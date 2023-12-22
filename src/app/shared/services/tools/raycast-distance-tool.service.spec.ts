import { TestBed } from '@angular/core/testing';

import { RaycastDistanceToolService } from './raycast-distance-tool.service';

describe('RaycastDistanceToolService', () => {
  let service: RaycastDistanceToolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RaycastDistanceToolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
