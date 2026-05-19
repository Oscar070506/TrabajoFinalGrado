import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameSeries } from './game-series';

describe('GameSeries', () => {
  let component: GameSeries;
  let fixture: ComponentFixture<GameSeries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameSeries]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameSeries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
