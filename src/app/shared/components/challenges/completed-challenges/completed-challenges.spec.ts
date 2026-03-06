import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletedChallenges } from './completed-challenges';

describe('CompletedChallenges', () => {
  let component: CompletedChallenges;
  let fixture: ComponentFixture<CompletedChallenges>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletedChallenges]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompletedChallenges);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
