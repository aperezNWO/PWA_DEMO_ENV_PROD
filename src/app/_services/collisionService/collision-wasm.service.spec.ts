import { TestBed } from '@angular/core/testing';

import { CollisionWasmService } from './collision-wasm.service';

describe('CollisionWasmService', () => {
  let service: CollisionWasmService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CollisionWasmService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
