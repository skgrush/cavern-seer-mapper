import { TestBed } from '@angular/core/testing';

import { CavernSeerOpenerService } from './cavern-seer-opener.service';

describe('CavernSeerOpenerService', () => {
  let service: CavernSeerOpenerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CavernSeerOpenerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
