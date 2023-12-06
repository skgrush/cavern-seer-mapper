import { TestBed } from '@angular/core/testing';

import { ModelLoadService } from './model-load.service';

describe('ModelService', () => {
  let service: ModelLoadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelLoadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
