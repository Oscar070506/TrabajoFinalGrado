import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLevelRuns } from './user-level-runs';

describe('UserLevelRuns', () => {
  let component: UserLevelRuns;
  let fixture: ComponentFixture<UserLevelRuns>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserLevelRuns]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserLevelRuns);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
