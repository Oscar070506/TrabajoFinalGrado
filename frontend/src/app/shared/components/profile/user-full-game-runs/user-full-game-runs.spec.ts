import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserFullGameRuns } from './user-full-game-runs';

describe('UserFullGameRuns', () => {
  let component: UserFullGameRuns;
  let fixture: ComponentFixture<UserFullGameRuns>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFullGameRuns]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserFullGameRuns);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
