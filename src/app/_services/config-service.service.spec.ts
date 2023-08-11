import { TestBed } from '@angular/core/testing';

import { ConfigService } from '../_services/config-service.service';

describe('ConfigServiceService', () => {
  let service: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
