import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitRun } from './submit-run';

describe('SubmitRun', () => {
  let component: SubmitRun;
  let fixture: ComponentFixture<SubmitRun>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitRun]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmitRun);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
