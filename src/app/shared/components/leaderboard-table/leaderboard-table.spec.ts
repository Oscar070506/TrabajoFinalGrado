import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaderboardTable } from './leaderboard-table';

describe('LeaderboardTable', () => {
  let component: LeaderboardTable;
  let fixture: ComponentFixture<LeaderboardTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaderboardTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
