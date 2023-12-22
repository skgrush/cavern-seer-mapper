import { TestBed } from '@angular/core/testing';

import { NoToolService } from './no-tool.service';

describe('NoToolService', () => {
  let service: NoToolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoToolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
