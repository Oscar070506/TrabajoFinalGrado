import { TestBed } from '@angular/core/testing';

import { Daltonism } from './daltonism';

describe('Daltonism', () => {
  let service: Daltonism;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Daltonism);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
