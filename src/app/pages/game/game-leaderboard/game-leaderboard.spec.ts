import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameLeaderboard } from './game-leaderboard';

describe('GameLeaderboard', () => {
  let component: GameLeaderboard;
  let fixture: ComponentFixture<GameLeaderboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameLeaderboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameLeaderboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
