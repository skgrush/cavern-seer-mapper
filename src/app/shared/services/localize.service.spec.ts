import { TestBed } from '@angular/core/testing';

import { LocalizeService } from './localize.service';

describe('LocalizeService', () => {
  let service: LocalizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
