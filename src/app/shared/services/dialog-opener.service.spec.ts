import { TestBed } from '@angular/core/testing';

import { DialogOpenerService } from './dialog-opener.service';

describe('DialogOpenerService', () => {
  let service: DialogOpenerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DialogOpenerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
