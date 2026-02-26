import { TestBed } from '@angular/core/testing';

import { PopUpVideo } from './pop-up-video';

describe('PopUpVideo', () => {
  let service: PopUpVideo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PopUpVideo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
