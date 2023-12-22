import { TestBed } from '@angular/core/testing';

import { AnnotationBuilderService } from './annotation-builder.service';

describe('AnnotationBuilderService', () => {
  let service: AnnotationBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnnotationBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
