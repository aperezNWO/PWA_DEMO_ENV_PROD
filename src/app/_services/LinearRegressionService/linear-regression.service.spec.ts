import { TestBed } from '@angular/core/testing';

import { LinearRegressionService } from './linear-regression.service';

describe('LinearRegressionService', () => {
  let service: LinearRegressionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LinearRegressionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
